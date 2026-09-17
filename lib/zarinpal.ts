// Thin wrapper around ZarinPal's v4 JSON payment gateway API.
// Docs: https://www.zarinpal.com/docs/paymentGateway/connectToGateway

const ZARINPAL_MERCHANT_ID = process.env.ZARINPAL_MERCHANT_ID || "00000000-0000-0000-0000-000000000000"
// Default to sandbox unless explicitly turned off — safer default for a project still in dev.
const ZARINPAL_SANDBOX = process.env.ZARINPAL_SANDBOX !== "false"

const API_BASE = ZARINPAL_SANDBOX ? "https://sandbox.zarinpal.com" : "https://payment.zarinpal.com"
const STARTPAY_HOST = ZARINPAL_SANDBOX ? "https://sandbox.zarinpal.com" : "https://www.zarinpal.com"

// IMPORTANT: verify this against ZarinPal's current docs before going live.
// The v4 API expects amount in Rial. Your app's `amount` fields are in Toman (based on
// the تومان labels throughout the UI), so we multiply by 10 here.
function tomanToRial(amountToman: number) {
    return amountToman * 10
}

export async function zarinpalRequestPayment(params: {
    amountToman: number
    description: string
    callbackUrl: string
    mobile?: string
    email?: string
}) {
    const res = await fetch(`${API_BASE}/pg/v4/payment/request.json`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            merchant_id: ZARINPAL_MERCHANT_ID,
            amount: tomanToRial(params.amountToman),
            callback_url: params.callbackUrl,
            description: params.description,
            metadata: {
                mobile: params.mobile,
                email: params.email
            }
        })
    })

    const json = await res.json()

    if (!json.data || json.data.code !== 100) {
        throw new Error(json.errors?.message || "خطا در اتصال به درگاه پرداخت")
    }

    return {
        authority: json.data.authority as string,
        paymentUrl: `${STARTPAY_HOST}/pg/StartPay/${json.data.authority}`
    }
}

export async function zarinpalVerifyPayment(params: {
    amountToman: number
    authority: string
}) {
    const res = await fetch(`${API_BASE}/pg/v4/payment/verify.json`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            merchant_id: ZARINPAL_MERCHANT_ID,
            amount: tomanToRial(params.amountToman),
            authority: params.authority
        })
    })

    const json = await res.json()

    // code 100 = verified just now, 101 = was already verified before — both count as success.
    if (json.data && (json.data.code === 100 || json.data.code === 101)) {
        return { success: true, refId: json.data.ref_id as number }
    }

    return { success: false, refId: null }
}
