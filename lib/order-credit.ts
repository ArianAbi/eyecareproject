export function calculateOrderTotal(order: { orderItems: { purchasedPrice: number }[], deliveryPrice: number }) {
    return order.orderItems.reduce((acc, item) => acc + item.purchasedPrice, 0) + order.deliveryPrice
}

// How much more credit the user needs before they can cover this order's total.
// Returns 0 if their current credit already covers it.
export function creditShortfall(orderTotal: number, userCredit: number) {
    return Math.max(orderTotal - userCredit, 0)
}
