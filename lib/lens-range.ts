type SingleDigit = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9
type Quarter = "00" | "25" | "50" | "75"

export type LensRangeValueType = `${SingleDigit}.${Quarter}` | "10.00"

// we go up with 0.25 intervals so one whole number takes 4 steps and we go from -10 to +10
function Construct(sign: "-" | "+", maxNumber = 10, noReverseSort = true) {
    const values = Array((maxNumber * 4)).fill(0).map((_unset, _index) => {
        const startingPoint = 10

        if (sign == "-") {
            if (noReverseSort) {

                const value = {
                    sign: sign,
                    value: Math.abs((0 + 0.25 + _index / 4)).toFixed(2)
                }

                return value
            }
            else {

                const value = {
                    sign: sign,
                    value: (startingPoint - _index / 4).toFixed(2)
                }

                return value
            }
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

export const AllLensRanges = [...Construct("-"), { sign: "", value: "0.00" }, ...Construct("+")]
export const NegativeLensRanges = [{ sign: "", value: "0.00" }, ...Construct("-")]
export const PositiveLensRanges = [{ sign: "", value: "0.00" }, ...Construct("+")]
