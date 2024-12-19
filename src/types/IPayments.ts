export default interface IPayments {
    order_id: string;
    stripe_payment_intent_id: string;
    amount: number;
    currency: string;
    status: string;
    payment_method_type: string;
    metadata: object;
    test_mode: boolean;

}
