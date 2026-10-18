package wallpaper

import (
	"bytes"
	"image"
	"image/color"
	"image/draw"
	"image/png"
	"math"
	"strconv"
	"strings"
	"time"

	"golang.org/x/image/font"
	"golang.org/x/image/font/gofont/gobold"
	"golang.org/x/image/font/gofont/goregular"
	"golang.org/x/image/font/opentype"
	"golang.org/x/image/math/fixed"
	"golang.org/x/image/vector"

	"running-calendar/internal/events"
	"running-calendar/internal/jakarta"
)

var (
	boldFont    = mustParse(gobold.TTF)
	regularFont = mustParse(goregular.TTF)

	colBackground = color.RGBA{0x06, 0x06, 0x06, 0xff}
	colPaper      = color.RGBA{0xe6, 0xde, 0xce, 0xff}
	colInk        = color.RGBA{0x16, 0x13, 0x11, 0xff}
	colGold       = color.RGBA{0xd5, 0xc4, 0x9c, 0xff}
	colBadge      = color.RGBA{0xd4, 0xc1, 0x98, 0xff}
	colWhite      = color.RGBA{0xff, 0xff, 0xff, 0xff}
	colBody       = color.RGBA{0xcf, 0xcf, 0xcf, 0xff}
	colMeta       = color.RGBA{0xa5, 0xa5, 0xa5, 0xff}
	colRing       = color.RGBA{0x29, 0x29, 0x29, 0xff} // white at 16% over the background
)

func mustParse(ttf []byte) *opentype.Font {
	f, err := opentype.Parse(ttf)
	if err != nil {
		panic(err)
	}
	return f
}

// Model is the text content of one wallpaper.
type Model struct {
	Title         string
	PrimaryLabel  string
	BigNumber     string
	NumberCaption string
	CategoryLine  string
	DateLine      string
	LocationLine  string
	TimeLine      string
}

// NewModel computes wallpaper text for ev and distance d (which may be nil)
// relative to now.
func NewModel(ev events.Event, d *events.Distance, now time.Time) Model {
	date := ev.EventDate
	clock := "00:00"
	category := "EVENT"
	timeLine := "START TBA"
	if d != nil {
		date = d.Date
		category = d.Name
		if d.StartTime != nil {
			clock = *d.StartTime
			timeLine = "START " + *d.StartTime
		}
	}

	target, err := time.ParseInLocation("2006-01-02 15:04", date+" "+clock, jakarta.Location)
	if err != nil {
		target, _ = jakarta.ParseDate(date)
	}
	daysLeft := int(math.Ceil(target.Sub(now).Hours() / 24))

	m := Model{
		Title:         strings.ToUpper(ev.Title),
		BigNumber:     strconv.Itoa(abs(daysLeft)),
		NumberCaption: "HARI LAGI",
		CategoryLine:  strings.ToUpper(category),
		DateLine:      jakarta.LongDate(date),
		LocationLine:  strings.ToUpper(ev.Location),
		TimeLine:      timeLine,
	}
	switch {
	case daysLeft < 0:
		m.PrimaryLabel, m.NumberCaption = "EVENT SELESAI", "HARI BERLALU"
	case daysLeft == 0:
		m.PrimaryLabel = "HARI INI"
	case daysLeft == 1:
		m.PrimaryLabel = "BESOK"
	default:
		m.PrimaryLabel = "MENUJU START"
	}
	return m
}

func abs(v int) int {
	if v < 0 {
		return -v
	}
	return v
}

func clamp(v, lo, hi int) int {
	return min(max(v, lo), hi)
}

func pct(total int, ratio float64) int {
	return int(math.Round(float64(total) * ratio))
}

type textStyle struct {
	font       *opentype.Font
	size       float64
	lineHeight float64 // multiple of size
	spacing    float64 // extra px between glyphs
	color      color.Color
}

type canvas struct {
	img   *image.RGBA
	faces map[*opentype.Font]map[float64]font.Face
}

func (c *canvas) face(st textStyle) font.Face {
	bySize := c.faces[st.font]
	if bySize == nil {
		bySize = map[float64]font.Face{}
		c.faces[st.font] = bySize
	}
	if f, ok := bySize[st.size]; ok {
		return f
	}
	f, _ := opentype.NewFace(st.font, &opentype.FaceOptions{Size: st.size, DPI: 72, Hinting: font.HintingNone})
	bySize[st.size] = f
	return f
}

func (c *canvas) close() {
	for _, bySize := range c.faces {
		for _, f := range bySize {
			f.Close()
		}
	}
}

func (c *canvas) measure(st textStyle, text string) float64 {
	face := c.face(st)
	var w fixed.Int26_6
	prev := rune(-1)
	n := 0
	for _, r := range text {
		if prev >= 0 {
			w += face.Kern(prev, r)
		}
		adv, _ := face.GlyphAdvance(r)
		w += adv
		prev = r
		n++
	}
	if n > 1 {
		return float64(w)/64 + st.spacing*float64(n-1)
	}
	return float64(w) / 64
}

// drawLine draws one line of text whose line box starts at top.
func (c *canvas) drawLine(st textStyle, x, top float64, text string) {
	face := c.face(st)
	m := face.Metrics()
	ascent := float64(m.Ascent) / 64
	descent := float64(m.Descent) / 64
	baseline := top + (st.size*st.lineHeight-(ascent+descent))/2 + ascent

	d := font.Drawer{Dst: c.img, Src: image.NewUniform(st.color), Face: face}
	pos := x
	prev := rune(-1)
	for _, r := range text {
		if prev >= 0 {
			pos += float64(face.Kern(prev, r)) / 64
		}
		d.Dot = fixed.Point26_6{X: fixed.Int26_6(pos * 64), Y: fixed.Int26_6(baseline * 64)}
		d.DrawString(string(r))
		adv, _ := face.GlyphAdvance(r)
		pos += float64(adv)/64 + st.spacing
		prev = r
	}
}

// wrap breaks text into lines no wider than maxWidth, splitting words that
// are wider than a whole line.
func (c *canvas) wrap(st textStyle, text string, maxWidth float64) []string {
	var lines []string
	line := ""
	for _, word := range strings.Fields(text) {
		candidate := word
		if line != "" {
			candidate = line + " " + word
		}
		if c.measure(st, candidate) <= maxWidth {
			line = candidate
			continue
		}
		if line != "" {
			lines = append(lines, line)
		}
		line = word
		for c.measure(st, line) > maxWidth && len([]rune(line)) > 1 {
			runes := []rune(line)
			cut := len(runes) - 1
			for cut > 1 && c.measure(st, string(runes[:cut])) > maxWidth {
				cut--
			}
			lines = append(lines, string(runes[:cut]))
			line = string(runes[cut:])
		}
	}
	if line != "" {
		lines = append(lines, line)
	}
	return lines
}

func (c *canvas) fillRect(r image.Rectangle, col color.Color) {
	draw.Draw(c.img, r, image.NewUniform(col), image.Point{}, draw.Src)
}

// ring draws a circle outline of the given stroke width.
func (c *canvas) ring(cx, cy, radius, stroke float64, col color.Color) {
	b := c.img.Bounds()
	z := vector.NewRasterizer(b.Dx(), b.Dy())
	circle := func(r float64, reverse bool) {
		const steps = 96
		for i := 0; i <= steps; i++ {
			a := 2 * math.Pi * float64(i) / steps
			if reverse {
				a = -a
			}
			x, y := float32(cx+r*math.Cos(a)), float32(cy+r*math.Sin(a))
			if i == 0 {
				z.MoveTo(x, y)
			} else {
				z.LineTo(x, y)
			}
		}
		z.ClosePath()
	}
	circle(radius, false)
	circle(radius-stroke, true)
	z.Draw(c.img, b, image.NewUniform(col), image.Point{})
}

// Render draws m at width×height and returns PNG bytes. The layout follows the
// previous Satori design: paper-colored top band with the title, a large day
// countdown, and a footer with category, date, location and a "RUN" badge.
func Render(m Model, width, height int) ([]byte, error) {
	c := &canvas{img: image.NewRGBA(image.Rect(0, 0, width, height)), faces: map[*opentype.Font]map[float64]font.Face{}}
	defer c.close()

	padX := float64(pct(width, 0.07))
	footerInset := float64(pct(height, 0.055))
	titleTop := float64(pct(height, 0.16))
	titleBottom := float64(height - pct(height, 0.625))
	countdownTop := float64(pct(height, 0.445))
	titleWidth := float64(pct(width, 0.74))
	footerTextWidth := float64(pct(width, 0.62))
	countdownSize := float64(clamp(pct(width, 0.34), 340, 520))
	badgeSize := float64(clamp(pct(width, 0.105), 116, 140))

	c.fillRect(c.img.Bounds(), colBackground)
	c.fillRect(image.Rect(0, 0, width, pct(height, 0.41)), colPaper)

	// Title: bottom-aligned in the paper band, shrunk until it fits.
	title := textStyle{font: boldFont, size: float64(clamp(pct(width, 0.085), 84, 112)), lineHeight: 0.95, spacing: -4, color: colInk}
	var titleLines []string
	for {
		titleLines = c.wrap(title, m.Title, titleWidth)
		blockHeight := float64(len(titleLines)) * title.size * title.lineHeight
		if blockHeight <= titleBottom-titleTop || title.size <= 48 {
			break
		}
		title.size -= 4
	}
	y := titleBottom - float64(len(titleLines))*title.size*title.lineHeight
	for _, line := range titleLines {
		c.drawLine(title, padX, y, line)
		y += title.size * title.lineHeight
	}

	// Countdown.
	label := textStyle{font: boldFont, size: float64(clamp(pct(width, 0.026), 28, 36)), lineHeight: 1.2, spacing: 6, color: colGold}
	c.drawLine(label, padX, countdownTop, m.PrimaryLabel)

	number := textStyle{font: boldFont, size: countdownSize, lineHeight: 0.82, spacing: -22, color: colWhite}
	numberTop := countdownTop + label.size*label.lineHeight + 10
	c.drawLine(number, padX, numberTop, m.BigNumber)

	caption := textStyle{font: boldFont, size: float64(clamp(pct(width, 0.037), 38, 48)), lineHeight: 1.2, spacing: 8, color: colGold}
	numberBottom := numberTop + number.size*number.lineHeight
	captionTop := numberBottom - countdownSize*0.14 - caption.size*caption.lineHeight
	c.drawLine(caption, padX+c.measure(number, m.BigNumber)+28, captionTop, m.NumberCaption)

	// Footer, laid out bottom-up from the inset.
	category := textStyle{font: boldFont, size: float64(clamp(pct(width, 0.052), 56, 74)), lineHeight: 1.02, color: colWhite}
	body := textStyle{font: regularFont, size: float64(clamp(pct(width, 0.025), 26, 34)), lineHeight: 1.25, spacing: 2, color: colBody}
	meta := textStyle{font: regularFont, size: float64(clamp(pct(width, 0.02), 20, 28)), lineHeight: 1.25, spacing: 3, color: colMeta}

	type block struct {
		style textStyle
		lines []string
	}
	blocks := []block{
		{category, c.wrap(category, m.CategoryLine, footerTextWidth)},
		{body, c.wrap(body, m.DateLine, footerTextWidth)},
		{meta, c.wrap(meta, m.LocationLine+" · "+m.TimeLine, footerTextWidth)},
	}
	const gap = 18.0
	total := gap * float64(len(blocks)-1)
	for _, b := range blocks {
		total += float64(len(b.lines)) * b.style.size * b.style.lineHeight
	}
	footerBottom := float64(height) - footerInset
	y = footerBottom - total
	for _, b := range blocks {
		for _, line := range b.lines {
			c.drawLine(b.style, padX, y, line)
			y += b.style.size * b.style.lineHeight
		}
		y += gap
	}

	radius := badgeSize / 2
	cx := float64(width) - padX - radius
	cy := footerBottom - radius
	c.ring(cx, cy, radius, 2, colRing)
	badge := textStyle{font: regularFont, size: float64(clamp(pct(width, 0.017), 18, 22)), lineHeight: 1, spacing: 4, color: colBadge}
	c.drawLine(badge, cx-c.measure(badge, "RUN")/2, cy-badge.size/2, "RUN")

	var buf bytes.Buffer
	enc := png.Encoder{CompressionLevel: png.BestSpeed}
	if err := enc.Encode(&buf, c.img); err != nil {
		return nil, err
	}
	return buf.Bytes(), nil
}
