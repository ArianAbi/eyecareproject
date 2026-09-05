export function IsInRange(
    value: string,
    range: {
        positiveFrom: string
        positiveTo: string
        negativeFrom: string
        negativeTo: string
    }
) { 
    const numberValue = parseFloat(value)

    if(isNaN(numberValue)) {
        console.log(numberValue);
        console.log("Not a number");
        return
    }

    if(numberValue === 0){
        const positiveMin = parseFloat(range.positiveFrom)
        const negativeMin = parseFloat(range.negativeFrom)

        return numberValue === positiveMin || numberValue === negativeMin
    }

    if(numberValue > 0){
        const minRange = Math.min(parseFloat(range.positiveFrom),parseFloat(range.positiveTo))
        const maxRange = Math.max(parseFloat(range.positiveFrom),parseFloat(range.positiveTo))

        return numberValue >= minRange && numberValue <= maxRange
    }else{
        const minRange = parseFloat(range.negativeFrom)
        const maxRange = parseFloat(range.negativeTo)

        return numberValue <= minRange && numberValue >= maxRange
    }

}