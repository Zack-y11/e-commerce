import { OrderStatus } from "./EnumData";

export interface IOrders {
    user_id : string;
    status : OrderStatus;
    total_amount : number;
    shipping_address_id : string;
}

export interface IOrderItems {
    order_id : string;
    product_id : string;
    quantity : number;
    price_at_time : number;
}