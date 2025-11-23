const dataCtx = {
    GeoUrl: "data/ne_50m_admin_0_countries.geojson",
    immDataUrl: "data/raw/estat_migr_imm5prv.csv",
}


function checkImmDataIntegrity(){

    let missingCountries = [];
    let invalidCoordinates = [];
    let incompleteSexData = [];
    let incompleteAgeGrData = [];

    dataCtx.immDstCountries.forEach(country => {
        if (!dataCtx.countryInfo.has(country)) {
            missingCountries.push(country);
        } else {
            const info = dataCtx.countryInfo.get(country);
            if (info.center_x == null || info.center_y == null || 
                typeof info.center_x !== 'number' || typeof info.center_y !== 'number') {
                invalidCoordinates.push(country);
            }
        }
    });

    dataCtx.immSrcCoutries.forEach(country => {
        if (!dataCtx.countryInfo.has(country)) {
            if (!missingCountries.includes(country)) {
                missingCountries.push(country);
            }
        } else {
            const info = dataCtx.countryInfo.get(country);
            if (info.center_x == null || info.center_y == null || 
                typeof info.center_x !== 'number' || typeof info.center_y !== 'number') {
                if (!invalidCoordinates.includes(country)) {
                    invalidCoordinates.push(country);
                }
            }
        }
    });

    // Check sex data completeness: for each dstCountry, year and srcCountry there must be
    // either 3 different values: M, F and T;
    // or 2 different values: M and T or F and T;
    // or 1 distinct value: T;
    dataCtx.immDataGrouped.forEach((yearMap, dstCountry) => {
        yearMap.forEach((srcCountryMap, year) => {
            srcCountryMap.forEach((records, srcCountry) => {
                if (!Array.isArray(records) || records.length === 0) {
                    incompleteSexData.push({ dstCountry, year, srcCountry, issue: `Empty or invalid records` });
                } else {
                    const sexValues = records.map(r => r.sex).sort();
                    const uniqueSex = [...new Set(sexValues)];
                    
                    if (records.length === 3) {
                        if (uniqueSex.length !== 3 || !uniqueSex.includes("M") || !uniqueSex.includes("F") || !uniqueSex.includes("T")) {
                            incompleteSexData.push({ dstCountry, year, srcCountry, issue: `Expected [F, M, T], found [${sexValues.join(', ')}]` });
                        }
                    } else if (records.length === 2) {
                        const hasT = uniqueSex.includes("T");
                        const hasM = uniqueSex.includes("M");
                        const hasF = uniqueSex.includes("F");
                        if (!hasT || !(hasM || hasF)) {
                            incompleteSexData.push({ dstCountry, year, srcCountry, issue: `Expected [M, T] or [F, T], found [${sexValues.join(', ')}]` });
                        }
                    } else if (records.length === 1) {
                        if (sexValues[0] !== "T") {
                            incompleteSexData.push({ dstCountry, year, srcCountry, issue: `Expected [T], found [${sexValues.join(', ')}]` });
                        }
                    } else {
                        incompleteSexData.push({ dstCountry, year, srcCountry, issue: `Unexpected record count: ${records.length}` });
                    }
                }
            });
        });
    });

    // Check age group data: for each dstCountry, srcCountry, age and year there must be
    // at least one record with sex === "T" and a valid value attribute, if not add based on other attributes
    dataCtx.immDataWithAgeGrGrouped.forEach((srcCountryMap, dstCountry) => {
        srcCountryMap.forEach((ageMap, srcCountry) => {
            ageMap.forEach((yearMap, age) => {
                yearMap.forEach((records, year) => {
                    if (!Array.isArray(records) || records.length === 0) {
                        incompleteAgeGrData.push({ dstCountry, srcCountry, age, year, issue: `Empty or invalid records` });
                    } else {
                        let totalRecord = records.find(r => r.sex === "T");
                        
                        if (!totalRecord) {
                            const maleRecord = records.find(r => r.sex === "M");
                            const femaleRecord = records.find(r => r.sex === "F");
                            
                            if (maleRecord || femaleRecord) {
                                const maleValue = maleRecord?.value || 0;
                                const femaleValue = femaleRecord?.value || 0;
                                
                                totalRecord = {
                                    dstCountry: dstCountry,
                                    srcCountry: srcCountry,
                                    year: year,
                                    value: maleValue + femaleValue,
                                    sex: "T",
                                    age: age
                                };
                                
                                records.push(totalRecord);
                            } else {
                                incompleteAgeGrData.push({ dstCountry, srcCountry, age, year, issue: `Missing sex="T" record and no M/F records to calculate from` });
                            }
                        }
                        
                        if (totalRecord && (totalRecord.value == null || typeof totalRecord.value !== 'number')) {
                            incompleteAgeGrData.push({ dstCountry, srcCountry, age, year, issue: `Invalid or missing value attribute` });
                        }
                    }
                });
            });
        });
    });

    if (missingCountries.length > 0) {
        console.warn("Missing countries in geoJSON:", missingCountries);
    }

    if (invalidCoordinates.length > 0) {
        console.warn("Countries with invalid coordinates:", invalidCoordinates);
    }

    if (incompleteSexData.length > 0) {
        console.warn("Incomplete sex data entries:", incompleteSexData);
    }

    if (incompleteAgeGrData.length > 0) {
        console.warn("Incomplete age group data entries:", incompleteAgeGrData);
    }

    if (missingCountries.length === 0 && invalidCoordinates.length === 0 && incompleteSexData.length === 0 && incompleteAgeGrData.length === 0) {
        console.log("Immigration data integrity check passed!");
    }

}


function loadData(){
    
    return new Promise((resolve, reject) => {
        
        immDataWithAgeGr = d3.csv(dataCtx.immDataUrl, function(d) {
            
            const value = +d.OBS_VALUE;
            let dstCountry = d["Geopolitical entity (reporting)"];
            let srcCountry = d["Geopolitical entity (partner)"];

            if (value === 0 || dstCountry === srcCountry) {
                return null;
            }

            const countryNameMap = {
                "Türkiye": "Turkey",
                "Serbia": "Republic of Serbia",
                "Kosovo*": "Kosovo"
            };

            dstCountry = countryNameMap[dstCountry] || dstCountry;
            srcCountry = countryNameMap[srcCountry] || srcCountry;

            return {
                dstCountry: dstCountry,
                srcCountry: srcCountry,
                year: +d.TIME_PERIOD,
                value: value,
                sex: d.sex,
                age: d.age
            };

        });

        geoJson = d3.json(dataCtx.GeoUrl);

        dataCtx.countryInfo = new Map();
        
        Promise.all([immDataWithAgeGr, geoJson])
            .then((data) => {

                [immDataWithAgeGr, geoJson] = data;

                immData = immDataWithAgeGr.filter(d => d.age === "TOTAL");

                dataCtx.immData = immData;
                dataCtx.geoJson = geoJson;

                dataCtx.immDstCountries = [...new Set(immData.map(d => d.dstCountry))];
                dataCtx.immSrcCoutries = [...new Set(immData.map(d => d.srcCountry))];

                mapCtx.projection = d3.geoMercator().fitSize([mapCtx.MAP_WIDTH, mapCtx.MAP_HEIGHT], dataCtx.geoJson);
                mapCtx.immValueExt = d3.extent(dataCtx.immData.filter(d => d.sex === "T"), (d) => d.value);

                geoJson.features.forEach(feature => {
                    const [px, py] = mapCtx.projection([feature.properties.LABEL_X, feature.properties.LABEL_Y]);

                    dataCtx.countryInfo.set(
                        feature.properties.GEOUNIT, 
                        {
                            center_x: feature.properties.LABEL_X, 
                            center_y: feature.properties.LABEL_Y,
                            px: px,
                            py: py
                        }
                    );
                });

                dataCtx.immDataGrouped = d3.group(immData, d => d.dstCountry, d => d.year, d => d.srcCountry);
                dataCtx.immDataWithAgeGrGrouped = d3.group(immDataWithAgeGr,
                    d => d.dstCountry, d => d.srcCountry, d => d.age, d => d.year
                );

                checkImmDataIntegrity();

                console.log("immData:", dataCtx.immData);
                console.log("immDstCountries:", dataCtx.immDstCountries);
                console.log("immSrcCoutries:", dataCtx.immSrcCoutries);
                console.log("immDataGrouped:", dataCtx.immDataGrouped);
                console.log("immDataWithAgeGrGrouped:", dataCtx.immDataWithAgeGrGrouped);
                console.log("countryInfo:", dataCtx.countryInfo);
                console.log("geoJson:", dataCtx.geoJson);
                
                resolve();

            }).catch(function(error){
                console.log(error);
                reject(error);
            });
    });

};



