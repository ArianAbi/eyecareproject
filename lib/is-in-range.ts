export function IsInRange(
    value: {
        sph:string,
        cyl:string
    },
    range: {
        sphPositiveFrom: string
        sphPositiveTo: string
        sphNegativeFrom: string
        sphNegativeTo: string,
        cylFrom: string,
        cylTo: string,

    }
) { 
    const sphNumberValue = parseFloat(value.sph)
    const cylNumberValue = parseFloat(value.cyl)

    let sphInRange = false
    let cylInRange = false
    
    if(isNaN(sphNumberValue)) {
        console.log(sphNumberValue);
        console.log("Not a number");
        return
    }

    if(isNaN(cylNumberValue)) {
        console.log(sphNumberValue);
        console.log("Not a number");
        return
    }

    if(sphNumberValue === 0){
        const positiveMin = parseFloat(range.sphPositiveFrom)
        const negativeMin = parseFloat(range.sphNegativeFrom)

        sphInRange = sphNumberValue === positiveMin || sphNumberValue === negativeMin
    }

    if(sphNumberValue > 0){
        const minRange = Math.min(parseFloat(range.sphPositiveFrom),parseFloat(range.sphPositiveTo))
        const maxRange = Math.max(parseFloat(range.sphPositiveFrom),parseFloat(range.sphPositiveTo))

        sphInRange = sphNumberValue >= minRange && sphNumberValue <= maxRange
    }else if(sphNumberValue < 0){
        const minRange = parseFloat(range.sphNegativeFrom)
        const maxRange = parseFloat(range.sphNegativeTo)

        sphInRange= sphNumberValue <= minRange && sphNumberValue >= maxRange
    }

    // cyl check
    const cylMin = parseFloat(range.cylTo)
    const cylMax = parseFloat(range.cylFrom)

    cylInRange = cylNumberValue <= cylMax && cylNumberValue >= cylMin

    return {
        sphInRange,
        cylInRange
    }
}