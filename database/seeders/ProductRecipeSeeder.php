<?php

namespace Database\Seeders;

use App\Models\ProductRecipe;
use Illuminate\Database\Seeder;

class ProductRecipeSeeder extends Seeder
{
    public function run(): void
    {
        // product_id = ID produk jadi, raw_material_id = ID bahan baku
        // ID produk jadi: 3=kopi hitam, 4=kopi susu, 5=espresso, 6=cappuccino,
        //   7=latte, 8=matcha, 9=teh tarik, 10=jus jeruk,
        //   11=nasi goreng, 12=mie goreng, 13=roti bakar, 14=pisang goreng
        // ID bahan baku: 1=arabika, 2=robusta, 3=susu fresh, 4=susu evap,
        //   5=gula pasir, 6=gula aren, 7=sirup vanilla, 8=tepung, 9=telur,
        //   10=es batu, 11=nasi, 12=mie

        $recipes = [
            // Kopi Hitam: 15g arabika + 200ml air + es
            ['product_id' => 3, 'raw_material_id' => 1, 'quantity' => 15, 'unit' => 'gram', 'notes' => 'Single shot espresso'],
            ['product_id' => 3, 'raw_material_id' => 10, 'quantity' => 200, 'unit' => 'gram', 'notes' => 'Es batu untuk iced'],

            // Kopi Susu: 15g arabika + 100ml susu fresh + 30ml gula aren + es
            ['product_id' => 4, 'raw_material_id' => 1, 'quantity' => 15, 'unit' => 'gram', 'notes' => 'Single shot'],
            ['product_id' => 4, 'raw_material_id' => 3, 'quantity' => 100, 'unit' => 'ml', 'notes' => 'Fresh milk'],
            ['product_id' => 4, 'raw_material_id' => 6, 'quantity' => 30, 'unit' => 'ml', 'notes' => 'Brown sugar syrup'],

            // Espresso: 18g arabika
            ['product_id' => 5, 'raw_material_id' => 1, 'quantity' => 18, 'unit' => 'gram', 'notes' => 'Double shot'],

            // Cappuccino: 15g arabika + 120ml susu evap + 10g gula
            ['product_id' => 6, 'raw_material_id' => 1, 'quantity' => 15, 'unit' => 'gram'],
            ['product_id' => 6, 'raw_material_id' => 4, 'quantity' => 120, 'unit' => 'ml', 'notes' => 'Steamed milk'],
            ['product_id' => 6, 'raw_material_id' => 5, 'quantity' => 10, 'unit' => 'gram'],

            // Latte: 15g arabika + 200ml susu evap + 20ml sirup vanilla
            ['product_id' => 7, 'raw_material_id' => 1, 'quantity' => 15, 'unit' => 'gram'],
            ['product_id' => 7, 'raw_material_id' => 4, 'quantity' => 200, 'unit' => 'ml'],
            ['product_id' => 7, 'raw_material_id' => 7, 'quantity' => 20, 'unit' => 'ml'],

            // Matcha Latte: 10g matcha bubuk (pakai arabika sebagai placeholder) + 150ml susu fresh + 20ml sirup
            ['product_id' => 8, 'raw_material_id' => 3, 'quantity' => 150, 'unit' => 'ml'],
            ['product_id' => 8, 'raw_material_id' => 7, 'quantity' => 20, 'unit' => 'ml'],

            // Teh Tarik: 5g teh + 100ml susu evap + 30g gula
            ['product_id' => 9, 'raw_material_id' => 4, 'quantity' => 100, 'unit' => 'ml'],
            ['product_id' => 9, 'raw_material_id' => 5, 'quantity' => 30, 'unit' => 'gram'],

            // Nasi Goreng: 250g nasi + 2 telur + minyak
            ['product_id' => 11, 'raw_material_id' => 11, 'quantity' => 250, 'unit' => 'gram'],
            ['product_id' => 11, 'raw_material_id' => 9, 'quantity' => 2, 'unit' => 'pcs'],

            // Mie Goreng: 1 mie + 1 telur
            ['product_id' => 12, 'raw_material_id' => 12, 'quantity' => 1, 'unit' => 'pcs'],
            ['product_id' => 12, 'raw_material_id' => 9, 'quantity' => 1, 'unit' => 'pcs'],

            // Roti Bakar: 2 tepung + 1 telur + 10g gula
            ['product_id' => 13, 'raw_material_id' => 8, 'quantity' => 100, 'unit' => 'gram', 'notes' => 'Roti slice'],
            ['product_id' => 13, 'raw_material_id' => 9, 'quantity' => 1, 'unit' => 'pcs'],
            ['product_id' => 13, 'raw_material_id' => 5, 'quantity' => 10, 'unit' => 'gram'],

            // Pisang Goreng: 100g tepung + 1 telur + 10g gula
            ['product_id' => 14, 'raw_material_id' => 8, 'quantity' => 100, 'unit' => 'gram'],
            ['product_id' => 14, 'raw_material_id' => 9, 'quantity' => 1, 'unit' => 'pcs'],
            ['product_id' => 14, 'raw_material_id' => 5, 'quantity' => 10, 'unit' => 'gram'],
        ];

        foreach ($recipes as $r) {
            ProductRecipe::create($r);
        }
    }
}
