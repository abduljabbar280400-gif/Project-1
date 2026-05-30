<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Restaurant;
use App\Models\MenuItem;
use App\Models\DeliveryProfile;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Payout;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // 1. System Admin
        User::create([
            'name' => 'System Admin',
            'email' => 'admin@numnum.com',
            'password' => Hash::make('password'),
            'role' => 'admin',
            'phone' => '+1 555-0100',
        ]);

        // 2. Customer
        $customer = User::create([
            'name' => 'Alice Johnson',
            'email' => 'customer@numnum.com',
            'password' => Hash::make('password'),
            'role' => 'customer',
            'phone' => '+1 555-0199',
        ]);

        // 3. Chef (Restaurant Owner)
        $chef = User::create([
            'name' => 'Chef Mario',
            'email' => 'chef@numnum.com',
            'password' => Hash::make('password'),
            'role' => 'chef',
            'phone' => '+1 555-0122',
        ]);

        // 4. Create Restaurant for Chef Mario
        $restaurant = Restaurant::create([
            'user_id' => $chef->id,
            'name' => "Mario's Italian Bistro",
            'description' => 'Authentic stone-baked pizzas, homemade pastas, and rich tiramisu desserts.',
            'address' => '123 Gourmet Lane, Food District',
            'banner_image' => 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=600&q=80',
            'is_active' => true,
            'is_open' => true,
            'earnings_balance' => 380.00,
        ]);

        // 5. Create Menu Items for Mario's
        $items = [
            [
                'name' => 'Margherita Pizza',
                'description' => 'Stone-baked pizza topped with organic tomato sauce, fresh mozzarella, and sweet basil leaves.',
                'price' => 12.50,
                'category' => 'Pizzas',
                'image' => 'https://images.unsplash.com/photo-1604068549290-dea0e4a305ca?auto=format&fit=crop&w=300&q=80',
                'is_available' => true,
            ],
            [
                'name' => 'Pepperoni Feast Pizza',
                'description' => 'Double spicy cured pepperoni slices layered over premium mozzarella cheese and robust house marinara.',
                'price' => 14.99,
                'category' => 'Pizzas',
                'image' => 'https://images.unsplash.com/photo-1628840042765-356cda07504e?auto=format&fit=crop&w=300&q=80',
                'is_available' => true,
            ],
            [
                'name' => 'Fettuccine Alfredo',
                'description' => 'Fettuccine tossed in a rich, velvety Parmigiano-Reggiano cream sauce with fresh black pepper.',
                'price' => 13.50,
                'category' => 'Pastas',
                'image' => 'https://images.unsplash.com/photo-1645112411341-6c4fd023714a?auto=format&fit=crop&w=300&q=80',
                'is_available' => true,
            ],
            [
                'name' => 'Handmade Tiramisu',
                'description' => 'Ladyfingers soaked in espresso coffee and sweet coffee liqueur, layered with creamy whipped mascarpone.',
                'price' => 6.50,
                'category' => 'Desserts',
                'image' => 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?auto=format&fit=crop&w=300&q=80',
                'is_available' => true,
            ],
            [
                'name' => 'House Lemonade',
                'description' => 'Chilled fresh-squeezed lemons infused with organic raw honey and cool fresh mint.',
                'price' => 3.00,
                'category' => 'Drinks',
                'image' => 'https://images.unsplash.com/photo-1534353436294-0dbd4bdac845?auto=format&fit=crop&w=300&q=80',
                'is_available' => true,
            ]
        ];

        $menuItems = [];
        foreach ($items as $item) {
            $menuItems[] = MenuItem::create(array_merge($item, ['restaurant_id' => $restaurant->id]));
        }

        // 6. Delivery Partner (Dave)
        $driver = User::create([
            'name' => 'Delivery Dave',
            'email' => 'driver@numnum.com',
            'password' => Hash::make('password'),
            'role' => 'delivery',
            'phone' => '+1 555-0155',
        ]);

        $deliveryProfile = DeliveryProfile::create([
            'user_id' => $driver->id,
            'is_available' => true,
            'vehicle_type' => 'bike',
            'earnings_balance' => 45.00,
            'current_latitude' => 40.7128,
            'current_longitude' => -74.0060,
        ]);

        // 7. Seed some completed orders to show operational histories
        // Order 1 (Delivered past order)
        $subtotal = 33.99; // (1 Margherita Pizza, 1 Pepperoni Pizza, 2 Lemonades) - Wait, let's keep math simple
        $subtotal = 33.49; // 12.50 + 14.99 + 3.00 + 3.00 = 33.49
        $delivery_fee = 3.00;
        $service_fee = 1.50;
        $commission = 3.35; // 10% of 33.49
        $total = $subtotal + $delivery_fee + $service_fee;

        $order1 = Order::create([
            'customer_id' => $customer->id,
            'restaurant_id' => $restaurant->id,
            'delivery_profile_id' => $deliveryProfile->id,
            'status' => 'delivered',
            'subtotal' => $subtotal,
            'delivery_fee' => $delivery_fee,
            'service_fee' => $service_fee,
            'commission_amount' => $commission,
            'total_amount' => $total,
            'delivery_address' => '456 residential lane, apt 4B',
            'special_instructions' => 'Leave at the front door please.',
            'accepted_at' => now()->subMinutes(45),
            'prepared_at' => now()->subMinutes(30),
            'picked_up_at' => now()->subMinutes(20),
            'delivered_at' => now()->subMinutes(5),
        ]);

        OrderItem::create([
            'order_id' => $order1->id,
            'menu_item_id' => $menuItems[0]->id, // Margherita
            'quantity' => 1,
            'price' => 12.50,
        ]);

        OrderItem::create([
            'order_id' => $order1->id,
            'menu_item_id' => $menuItems[1]->id, // Pepperoni
            'quantity' => 1,
            'price' => 14.99,
        ]);

        OrderItem::create([
            'order_id' => $order1->id,
            'menu_item_id' => $menuItems[4]->id, // Lemonade
            'quantity' => 2,
            'price' => 3.00,
        ]);

        // Order 2 (Currently Pending order for Mario's Kitchen to see immediately!)
        $subtotal2 = 20.00; // 1 Fettuccine Alfredo, 1 Tiramisu
        $subtotal2 = 13.50 + 6.50; // 20.00
        $commission2 = 2.00;
        $total2 = $subtotal2 + $delivery_fee + $service_fee;

        $order2 = Order::create([
            'customer_id' => $customer->id,
            'restaurant_id' => $restaurant->id,
            'status' => 'pending',
            'subtotal' => $subtotal2,
            'delivery_fee' => $delivery_fee,
            'service_fee' => $service_fee,
            'commission_amount' => $commission2,
            'total_amount' => $total2,
            'delivery_address' => '789 highrise street, condo 12C',
            'special_instructions' => 'Ring doorbell once delivered.',
        ]);

        OrderItem::create([
            'order_id' => $order2->id,
            'menu_item_id' => $menuItems[2]->id, // Alfredo
            'quantity' => 1,
            'price' => 13.50,
        ]);

        OrderItem::create([
            'order_id' => $order2->id,
            'menu_item_id' => $menuItems[3]->id, // Tiramisu
            'quantity' => 1,
            'price' => 6.50,
        ]);

        // 8. Seed some mock payouts
        Payout::create([
            'user_id' => $chef->id,
            'amount' => 150.00,
            'bank_name' => 'First National Bank',
            'account_number' => '1234567890',
            'account_name' => 'Chef Mario Bistro LLC',
            'status' => 'processed',
            'created_at' => now()->subDays(5),
        ]);

        Payout::create([
            'user_id' => $chef->id,
            'amount' => 100.00,
            'bank_name' => 'First National Bank',
            'account_number' => '1234567890',
            'account_name' => 'Chef Mario Bistro LLC',
            'status' => 'pending',
            'created_at' => now()->subDays(1),
        ]);
    }
}
