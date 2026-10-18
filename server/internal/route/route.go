// Package route turns GPX course files into Google encoded polylines for the
// route_polyline field of an event distance.
package route

import (
	"encoding/xml"
	"errors"
	"fmt"
	"io"
	"math"
	"strconv"
	"strings"
)

// Point is a WGS84 coordinate in degrees.
type Point struct {
	Lat, Lng float64
}

const earthRadius = 6371008.8 // mean Earth radius in meters

// ParseGPX reads the track points (trk/trkseg/trkpt) of a GPX file and joins
// every segment of every track into one line, in file order. A file without
// tracks falls back to its route points (rte/rtept), so a file that carries
// the same course as both is not drawn twice. Repeated consecutive points are
// dropped.
func ParseGPX(r io.Reader) ([]Point, error) {
	var track, rte []Point
	dec := xml.NewDecoder(r)
	for {
		tok, err := dec.Token()
		if err == io.EOF {
			break
		}
		if err != nil {
			return nil, fmt.Errorf("read GPX: %w", err)
		}
		el, ok := tok.(xml.StartElement)
		if !ok || (el.Name.Local != "trkpt" && el.Name.Local != "rtept") {
			continue
		}
		p, err := parsePoint(el)
		if err != nil {
			return nil, err
		}
		if el.Name.Local == "trkpt" {
			track = appendPoint(track, p)
		} else {
			rte = appendPoint(rte, p)
		}
	}
	points := track
	if len(points) == 0 {
		points = rte
	}
	if len(points) < 2 {
		return nil, errors.New("GPX has fewer than 2 distinct trkpt or rtept points")
	}
	return points, nil
}

func parsePoint(el xml.StartElement) (Point, error) {
	var p Point
	var hasLat, hasLng bool
	for _, a := range el.Attr {
		v, err := strconv.ParseFloat(strings.TrimSpace(a.Value), 64)
		switch a.Name.Local {
		case "lat":
			if err != nil || v < -90 || v > 90 {
				return p, fmt.Errorf("%s has invalid lat %q", el.Name.Local, a.Value)
			}
			p.Lat, hasLat = v, true
		case "lon":
			if err != nil || v < -180 || v > 180 {
				return p, fmt.Errorf("%s has invalid lon %q", el.Name.Local, a.Value)
			}
			p.Lng, hasLng = v, true
		}
	}
	if !hasLat || !hasLng {
		return p, fmt.Errorf("%s is missing lat or lon", el.Name.Local)
	}
	return p, nil
}

func appendPoint(points []Point, p Point) []Point {
	if n := len(points); n > 0 && points[n-1] == p {
		return points
	}
	return append(points, p)
}

// Distance returns the length of the line in meters (haversine).
func Distance(points []Point) float64 {
	var total float64
	for i := 1; i < len(points); i++ {
		a, b := points[i-1], points[i]
		dLat := rad(b.Lat - a.Lat)
		dLng := rad(b.Lng - a.Lng)
		h := math.Pow(math.Sin(dLat/2), 2) + math.Cos(rad(a.Lat))*math.Cos(rad(b.Lat))*math.Pow(math.Sin(dLng/2), 2)
		total += 2 * earthRadius * math.Asin(math.Min(1, math.Sqrt(h)))
	}
	return total
}

// Simplify drops points with Douglas-Peucker so that no removed point lies
// more than tolerance meters from the simplified line. Distances are measured
// in a local equirectangular projection centered on the course, which is
// accurate enough for a race course.
func Simplify(points []Point, tolerance float64) []Point {
	if len(points) < 3 {
		return points
	}
	var latSum float64
	for _, p := range points {
		latSum += p.Lat
	}
	kx := earthRadius * math.Cos(rad(latSum/float64(len(points))))
	xy := make([][2]float64, len(points))
	for i, p := range points {
		xy[i] = [2]float64{rad(p.Lng) * kx, rad(p.Lat) * earthRadius}
	}

	keep := make([]bool, len(points))
	keep[0], keep[len(points)-1] = true, true
	stack := [][2]int{{0, len(points) - 1}}
	for len(stack) > 0 {
		span := stack[len(stack)-1]
		stack = stack[:len(stack)-1]
		first, last := span[0], span[1]
		maxDist, index := 0.0, -1
		for i := first + 1; i < last; i++ {
			if d := segmentDistance(xy[i], xy[first], xy[last]); d > maxDist {
				maxDist, index = d, i
			}
		}
		if index >= 0 && maxDist > tolerance {
			keep[index] = true
			stack = append(stack, [2]int{first, index}, [2]int{index, last})
		}
	}

	out := make([]Point, 0, len(points))
	for i, p := range points {
		if keep[i] {
			out = append(out, p)
		}
	}
	return out
}

// segmentDistance is the distance from p to the segment a-b.
func segmentDistance(p, a, b [2]float64) float64 {
	dx, dy := b[0]-a[0], b[1]-a[1]
	t := 0.0
	if l2 := dx*dx + dy*dy; l2 > 0 {
		t = math.Max(0, math.Min(1, ((p[0]-a[0])*dx+(p[1]-a[1])*dy)/l2))
	}
	return math.Hypot(p[0]-(a[0]+t*dx), p[1]-(a[1]+t*dy))
}

// Encode returns the points as a Google encoded polyline at precision 5.
func Encode(points []Point) string {
	var sb strings.Builder
	var prevLat, prevLng int
	for _, p := range points {
		lat := int(math.Round(p.Lat * 1e5))
		lng := int(math.Round(p.Lng * 1e5))
		encodeValue(&sb, lat-prevLat)
		encodeValue(&sb, lng-prevLng)
		prevLat, prevLng = lat, lng
	}
	return sb.String()
}

func encodeValue(sb *strings.Builder, v int) {
	u := v << 1
	if v < 0 {
		u = ^u
	}
	for u >= 0x20 {
		sb.WriteByte(byte((0x20 | (u & 0x1f)) + 63))
		u >>= 5
	}
	sb.WriteByte(byte(u + 63))
}

func rad(deg float64) float64 {
	return deg * math.Pi / 180
}
