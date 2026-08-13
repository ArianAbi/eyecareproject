const ranges = [
    "0.00",
    "0.25",
    "0.50",
    "0.75",
    "1.00",
    "1.25",
    "1.50",
    "1.75",
    "2.00",
    "2.25",
    "2.50",
    "2.75",
    "3.00",
    "3.25",
    "3.50",
    "3.75",
    "4.00",
    "4.25",
    "4.50",
    "4.75",
    "5.00",
    "5.25",
    "5.50",
    "5.75",
    "6.00",
    "6.25",
    "6.50",
    "6.75",
    "7.00",
    "7.25",
    "7.50",
    "7.75",
    "8.00",
    "8.25",
    "8.50",
    "8.75",
    "9.00",
    "9.25",
    "9.50",
    "9.75",
    "10.00"
] as const

export type LensRangeValueType = typeof ranges[number]

// we go up with 0.25 intervals so one whole number takes 4 steps and we go from -10 to +10
function Construct(sign: "-" | "+", maxNumber = 10) {
    const values = Array((maxNumber * 4)).fill(0).map((_unset, _index) => {
        const startingPoint = 10

        if (sign == "-") {
            const value = {
                sign: sign,
                value: (startingPoint - _index / 4).toFixed(2)
            }

            return value
        }
        else {
            const value = {
                sign: sign,
                value: ((startingPoint - startingPoint + 0.25) + _index / 4).toFixed(2)
            }

            return value
        }
    })

    return values
}

export type LensRangeItemType = { sign: "-" | "+", value: LensRangeValueType }

export const AllLensRanges = [...Construct("-"), { sign: "-", value: "0.00" }, ...Construct("+")]