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
              <sld:ColorMapEntry color="#CC0000" quantity="0.018959980458021164" label="  Very low"/>
              <sld:ColorMapEntry color="#FF8000" quantity="0.21516798436641693" label="  Low"/>
              <sld:ColorMapEntry color="#FFFF00" quantity="0.4113759882748127" label="  Moderate"/>
              <sld:ColorMapEntry color="#32CD32" quantity="0.6075839921832085" label="  High"/>
              <sld:ColorMapEntry color="#006400" quantity="0.8037919960916042" label="  Very high"/>
            </sld:ColorMap>
          </sld:RasterSymbolizer>
        </sld:Rule>
      </sld:FeatureTypeStyle>
    </sld:UserStyle>
  </sld:NamedLayer>
</sld:StyledLayerDescriptor>
