<?xml version="1.0" encoding="UTF-8"?>
<sld:StyledLayerDescriptor xmlns:sld="http://www.opengis.net/sld" xmlns="http://www.opengis.net/sld" xmlns:gml="http://www.opengis.net/gml" xmlns:ogc="http://www.opengis.net/ogc" version="1.0.0">
  <sld:NamedLayer>
    <sld:Name>raster</sld:Name>
    <sld:UserStyle>
      <sld:Name>raster</sld:Name>
      <sld:Title>5-Class Raster Style with Ranges</sld:Title>
      <sld:Abstract>SLD with explicit value ranges for raster styling</sld:Abstract>
      <sld:FeatureTypeStyle>
        <sld:Rule>
          <sld:RasterSymbolizer>
            <sld:ColorMap type="ramp" extended="True">
              <sld:ColorMapEntry color="#CC0000" quantity="0.03601614758372307" label="  Very low"/>
              <sld:ColorMapEntry color="#FF8000" quantity="0.22881291806697845" label="  Low"/>
              <sld:ColorMapEntry color="#FFFF00" quantity="0.42160968855023384" label="  Moderate"/>
              <sld:ColorMapEntry color="#32CD32" quantity="0.6144064590334892" label="  High"/>
              <sld:ColorMapEntry color="#006400" quantity="0.8072032295167446" label="  Very high"/>
            </sld:ColorMap>
          </sld:RasterSymbolizer>
        </sld:Rule>
      </sld:FeatureTypeStyle>
    </sld:UserStyle>
  </sld:NamedLayer>
</sld:StyledLayerDescriptor>
