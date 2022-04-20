// Modis Cloud Masking
//
// Calculate how frequently a location is labeled as clear (i.e. non-cloudy)
// according to the "internal cloud algorithm flag" of the MODIS "state 1km"
// QA band.

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
var maskClouds = function(image) {
  // Select the QA band.
  var QA = image.select('DetailedQA');
  // Get the MOD_LAND_QA bits
  var internalCloud = getQABits(QA, 0, 1, 'MOD_LAND_QA');
  // Return an image masking out cloudy areas.
  return image.mask(internalCloud.eq(0));
};

var collection = ee.ImageCollection('MODIS/MOD13Q1')
                   .filterDate('2000-02-24', '2014-07-01')
                   .select(['NDVI','DetailedQA']);
print(collection)


// Map the cloud masking function over the collection.
var collectionCloudMasked = collection.map(maskClouds);
print(collectionCloudMasked)

// Get the total number of potential observations for the time interval.
var totalObsCount = collection.count();
// Get the total number of observations for non-cloudy pixels for the time
// interval.  The mask is set to unity so that all locations have counts, and
// the ratios later computed have values everywhere.
var clearObsCount = collectionCloudMasked.count().mask(1);

var palette = ['FFFFFF', 'CE7E45', 'DF923D', 'F1B555', 'FCD163', '99B718',
               '74A901', '66A000', '529400', '3E8601', '207401', '056201',
               '004C00', '023B01', '012E01', '011D01', '011301'];

//addToMap(totalObsCount,{},'total count');
//addToMap(clearObsCount,{},'clear count');

// addToMap(
//     collectionCloudMasked.mean(),
//     {bands: ['NDVI'],
//     min:-1000,
//     max:10000,
//     palette:palette
//     },
//     'mean of masked collection'
//   );
