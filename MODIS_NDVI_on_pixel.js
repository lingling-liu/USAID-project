var table = ee.FeatureCollection("users/jsgerber/SenegalDataLocationsYear1");

// https://groups.google.com/g/google-earth-engine-developers/c/MvU5BR_xKic/m/HzJhaW91DgAJ

Map.setCenter (-15.139051438488167,14.045314410074411); 
var GDriveOutputImgFolder = 'GEEOUTPUTS/MODIS_NDVI'; 

// MODIS Cloud Masking
/*
 * A function that returns an image containing just the specified QA bits.
 *
 * Args:
 *   image - The QA Image to get bits from.
 *   start - The first bit position, 0-based.
 *   end   - The last bit position, inclusive.
 *   name  - A name for the output image.
 */
var getQABits = function(image, start, end, newName) {
    // Compute the bits we need to extract.
    var pattern = 0;
    for (var i = start; i <= end; i++) {
       pattern += Math.pow(2, i);
    }
    // Return a single band image of the extracted QA bits, giving the band
    // a new name.
    return image.select([0], [newName])
                  .bitwiseAnd(pattern)
                  .rightShift(start);
};

// A function to mask out cloudy pixels.
//Pattern is set up to have 1's in the bits that
//you've specified with start and end, and it gets rid of all the others.
//Based on the MOD13Q1 page, the "good" images are when bits 0-1 (MODLAND_QA) contain a zero,
//so you want the mask to contain a 1 when the MODLAND_QA bits are zero:
//return image.mask(internalCloud.eq(0));
var maskClouds = function(image) {
  // Select the QA band.
  var QA = image.select('DetailedQA');
  // Get the MOD_LAND_QA bits
  var internalCloud = getQABits(QA, 0, 1, 'MOD_LAND_QA');
  // Return an image masking out cloudy areas.
  return image.mask(internalCloud.eq(0));
};

var FirstYear = 2000;
var LastYear = 2021;

var collection = ee.ImageCollection('MODIS/006/MOD13Q1')
             .filterDate(String(FirstYear)+'-01-01', String(LastYear)+'-12-31')
             .select(['NDVI','DetailedQA']); 
print('coll1',collection);

// Map the cloud masking function over the collection.
var collectionCloudMasked = collection.map(maskClouds);
print('coll1',collectionCloudMasked);


var img = collectionCloudMasked.select('NDVI').toBands();
print('img',img);

var scale = 231.65635826395825;

var Arid_points = table;
Map.addLayer(Arid_points, {}, 'Arid_points');

// on pixel
var ndvi_time_series = img.reduceRegions({ 
  collection: Arid_points,
  reducer: ee.Reducer.mean(),
  scale: scale});


Export.table.toDrive({
  collection:ndvi_time_series,
  description: 'MODIS_NDVI_on_pixel_Senegal_masked',
  fileFormat:'CSV',
  folder: GDriveOutputImgFolder
}); 


