// Package wallpaper renders countdown lock-screen wallpapers as PNG.
package wallpaper

type Preset struct {
	Key    string
	Width  int
	Height int
}

// Presets mirrors WALLPAPER_PRESETS in web/js/wallpaper-presets.js.
var Presets = map[string]Preset{
	"iphone-11-xr":                                 {Width: 828, Height: 1792},
	"iphone-11-pro-x-xs":                           {Width: 1125, Height: 2436},
	"iphone-11-pro-max-xs-max":                     {Width: 1242, Height: 2688},
	"iphone-12-12-pro-13-13-pro-14":                {Width: 1170, Height: 2532},
	"iphone-12-mini-13-mini":                       {Width: 1080, Height: 2340},
	"iphone-12-pro-max-13-pro-max-14-plus":         {Width: 1284, Height: 2778},
	"iphone-14-pro-15-15-pro":                      {Width: 1179, Height: 2556},
	"iphone-14-pro-max-15-plus-15-pro-max-16-plus": {Width: 1290, Height: 2796},
	"iphone-16-pro":                                {Width: 1206, Height: 2622},
	"iphone-16-pro-max":                            {Width: 1320, Height: 2868},
}

const DefaultPreset = "iphone-14-pro-max-15-plus-15-pro-max-16-plus"

// PreviewMaxWidth caps preview renders so the in-page preview loads quickly.
const PreviewMaxWidth = 828

func GetPreset(key string) Preset {
	p, ok := Presets[key]
	if !ok {
		key = DefaultPreset
		p = Presets[key]
	}
	p.Key = key
	return p
}
