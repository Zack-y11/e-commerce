export interface IProducts {
    sku: string;
    name: string;
    description: string;
    price: number;
    stock_quantity: number;
    category_id: number;
    image_url: string;
    weight: number;
    dimensions: string;
    is_active: boolean;
}