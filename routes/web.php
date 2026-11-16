<?php

use App\Http\Controllers\AccountController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\CustomerAuthController;
use App\Http\Controllers\HeroController;
use App\Http\Controllers\PersonalizationController;
use App\Http\Controllers\OrderController;
use App\Http\Controllers\FeaturesController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\CanadaWarehouseStockController;
use App\Http\Controllers\ApiProductController;
use App\Http\Controllers\AboutPageSectionController;
use App\Http\Controllers\HowWeHelpController;
use App\Http\Controllers\ShopByProductController;
use App\Http\Controllers\ShopByIndustryController;
use App\Http\Controllers\SubCategoryController;
use App\Http\Controllers\GrandChildController;
use App\Http\Controllers\StageController;
use App\Http\Controllers\PersonalizerPriceController;
use App\Http\Controllers\SizeController;
use App\Http\Controllers\ColorController;
use App\Http\Controllers\SettingsController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('home');
});

Route::get('/shop', function () {
    return view('home');
});

Route::get('/shop/{path?}', function () {
    return view('home');
})->where('path', '.*');

Route::get('/singleProduct', function () {
    return view('home');
});

Route::get('/singleProduct/{productSlug}', function () {
    return view('home');
});

Route::get('/cart', function () {
    return view('home');
});

Route::get('/checkout', function () {
    return view('home');
});

Route::get('/order-confirmation', function () {
    return view('home');
});


Route::get('/about', function () {
    return view('home');
});

Route::get('/contact', function () {
    return view('home');
});

Route::get('/login', function () {
    return view('home');
});

Route::get('/register', function () {
    return view('home');
});

Route::get('/forgot-password', function () {
    return view('home');
});

Route::get('/reset-password/{token}', function () {
    return view('home');
});

// Customer dashboard (React routes). Registered before the authenticated catch-all at the bottom.
Route::get('/account/{path?}', function () {
    return view('home');
})->where('path', '.*');

Route::get('/admin/{path?}', function () {
    return view('app');
})->where('path', '.*')->name('login');

Route::get('/personalizer/{path?}', function () {
    return view('app');
})->where('path', '.*');
Route::get('/public/sizes', [SizeController::class, 'index']);
Route::get('/public/colors', [ColorController::class, 'index']);
Route::prefix('api')->group(function () {
    Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:6,1');
    Route::get('/public/hero', [HeroController::class, 'publicHero']);
    Route::get('/public/features', [FeaturesController::class, 'publicIndex']);
    Route::get('/public/how-we-help', [HowWeHelpController::class, 'publicShow']);
    Route::get('/public/shop-by-product', [ShopByProductController::class, 'publicShow']);
    Route::get('/public/shop-by-industry', [ShopByIndustryController::class, 'publicShow']);
    Route::get('/public/categories', [CategoryController::class, 'publicIndex']);
    Route::get('/public/settings', [SettingsController::class, 'publicLatest']);
    Route::get('/public/products', [ApiProductController::class, 'index']);
    // Registered before {product:slug} so "search" isn't treated as a product slug.
    Route::get('/public/products/search', [ApiProductController::class, 'search'])->middleware('throttle:120,1');
    Route::get('/public/products/{product:slug}',[ApiProductController::class, 'show']);
    Route::get('/public/customize-home-page', [\App\Http\Controllers\CustomizeHomeController::class, 'publicShow']);
    Route::get('/public/about-page', [AboutPageSectionController::class, 'publicIndex']);
    Route::get('/public/personalizer-prices', [PersonalizerPriceController::class, 'index']);
    Route::post('/personalizations', [PersonalizationController::class, 'store']);
    Route::patch('/personalizations/{personalization}/confirm', [PersonalizationController::class, 'confirm']);
    Route::post('/orders', [OrderController::class, 'store']);

    // Storefront customer accounts
    Route::prefix('account')->group(function () {
        Route::get('/session', [CustomerAuthController::class, 'session']);
        Route::post('/register', [CustomerAuthController::class, 'register'])->middleware('throttle:6,1');
        Route::post('/login', [CustomerAuthController::class, 'login'])->middleware('throttle:6,1');
        Route::post('/forgot-password', [CustomerAuthController::class, 'forgotPassword'])->middleware('throttle:5,1');
        Route::post('/reset-password', [CustomerAuthController::class, 'resetPassword'])->middleware('throttle:6,1');

        Route::middleware('auth:sanctum')->group(function () {
            Route::post('/logout', [CustomerAuthController::class, 'logout']);
            Route::get('/dashboard', [AccountController::class, 'dashboard']);
            Route::put('/profile', [AccountController::class, 'updateProfile']);
            Route::put('/password', [AccountController::class, 'updatePassword'])->middleware('throttle:6,1');
            Route::get('/orders', [AccountController::class, 'orders']);
            Route::get('/orders/{orderNumber}', [AccountController::class, 'showOrder']);
            Route::post('/orders/{orderNumber}/cancel', [AccountController::class, 'cancelOrder']);
            Route::get('/addresses', [AccountController::class, 'addresses']);
            Route::post('/addresses', [AccountController::class, 'storeAddress']);
            Route::put('/addresses/{address}', [AccountController::class, 'updateAddress'])->whereNumber('address');
            Route::post('/addresses/{address}/default', [AccountController::class, 'setDefaultAddress'])->whereNumber('address');
            Route::delete('/addresses/{address}', [AccountController::class, 'destroyAddress'])->whereNumber('address');
            Route::get('/designs', [AccountController::class, 'designs']);
        });
    });

    Route::middleware('auth:sanctum')->group(function () {
        Route::get('/user', function (Request $request) {
            $user = $request->user();

            return response()->json([...$user->toArray(), 'is_admin' => $user->isAdmin()]);
        });

        Route::post('/logout', [AuthController::class, 'logout']);
    });

    // Admin panel API: staff only. Customers are logged in through the same session guard.
    Route::middleware(['auth:sanctum', 'admin'])->group(function () {
        // personalization controller
        Route::get('/personalizations', [PersonalizationController::class, 'index']);
        Route::get('/personalizations/{personalization}', [PersonalizationController::class, 'show']);
        Route::put('/personalizations/{personalization}', [PersonalizationController::class, 'update']);
        Route::delete('/personalizations/{personalization}', [PersonalizationController::class, 'destroy']);
        // Order controller
        Route::get('/orders', [OrderController::class, 'index']);
        Route::get('/orders/{order}', [OrderController::class, 'show'])->whereNumber('order');
        Route::put('/orders/{order}', [OrderController::class, 'update'])->whereNumber('order');
        // Size Controller
        	Route::put('/sizes/reorder', [SizeController::class, 'reorder']);
	    Route::apiResource('/sizes', SizeController::class)->whereNumber('size');

        // Hero Controller
        Route::apiResource('/heroes', HeroController::class);

        // Features Controller
        Route::apiResource('/features', FeaturesController::class);

        // Category Controller
        Route::apiResource('/categories', CategoryController::class);

        // SubCategory Controller
        Route::apiResource('/sub-categories', SubCategoryController::class);

        // GrandChild Controller (reorder must be registered before the {grand_child} routes)
        Route::put('/grand-childs/reorder', [GrandChildController::class, 'reorder']);
        Route::apiResource('/grand-childs', GrandChildController::class)->whereNumber('grand_child');

        // stage Controller
        Route::apiResource('/stages', StageController::class);

        // Personalizer Price Controller
        Route::apiResource('/personalizer-prices', PersonalizerPriceController::class);
        
        // Settings Controller
        Route::apiResource('/settings', SettingsController::class);
        // Color Controller
        	Route::apiResource('/colors', ColorController::class);

        // Shop By Industry section + repeater items
        Route::get('/shop-by-industry', [ShopByIndustryController::class, 'show']);
        Route::put('/shop-by-industry', [ShopByIndustryController::class, 'updateSection']);
        Route::post('/shop-by-industry/items', [ShopByIndustryController::class, 'storeItem']);
        Route::put('/shop-by-industry/items/{item}', [ShopByIndustryController::class, 'updateItem']);
        Route::delete('/shop-by-industry/items/{item}', [ShopByIndustryController::class, 'destroyItem']);

        // How We Help section + repeater items
        Route::get('/how-we-help', [HowWeHelpController::class, 'show']);
        Route::put('/how-we-help', [HowWeHelpController::class, 'updateSection']);
        Route::post('/how-we-help/items', [HowWeHelpController::class, 'storeItem']);
        Route::put('/how-we-help/items/{item}', [HowWeHelpController::class, 'updateItem']);
        Route::delete('/how-we-help/items/{item}', [HowWeHelpController::class, 'destroyItem']);


        // Shop By Product section + repeater items
        Route::get('/shop-by-product', [ShopByProductController::class, 'show']);
        Route::put('/shop-by-product', [ShopByProductController::class, 'updateSection']);
        Route::post('/shop-by-product/items', [ShopByProductController::class, 'storeItem']);
        Route::put('/shop-by-product/items/{item}', [ShopByProductController::class, 'updateItem']);
        Route::delete('/shop-by-product/items/{item}', [ShopByProductController::class, 'destroyItem']);

        // Customize Home Page section
        Route::get('/customize-home-page', [\App\Http\Controllers\CustomizeHomeController::class, 'show']);
        Route::put('/customize-home-page', [\App\Http\Controllers\CustomizeHomeController::class, 'updateSection']);
        Route::delete('/customize-home-page/image', [\App\Http\Controllers\CustomizeHomeController::class, 'deleteImage']);

        // About Page Builder
        Route::get('/about-page', [AboutPageSectionController::class, 'index']);
        Route::put('/about-page/{sectionKey}', [AboutPageSectionController::class, 'update']);
        Route::delete('/about-page/{sectionKey}', [AboutPageSectionController::class, 'destroy']);
        Route::delete('/about-page/{sectionKey}/image', [AboutPageSectionController::class, 'deleteImage']);
        
        // Inventory public API proxy (Canada warehouse)
        Route::get('/inventory/canada-warehouse-stocks', [CanadaWarehouseStockController::class, 'index']);

        // API Products (synced from Inventory)
        Route::get('/api-products', [ApiProductController::class, 'index']);
        Route::post('/api-products/sync', [ApiProductController::class, 'sync']);
       
        // Product Controller (CRUD)
        Route::get('/products', [\App\Http\Controllers\ProductController::class, 'index']);
        Route::get('/products/{product}', [\App\Http\Controllers\ProductController::class, 'show']);
        Route::post('/products', [\App\Http\Controllers\ProductController::class, 'store']);
        Route::put('/products/{product}', [\App\Http\Controllers\ProductController::class, 'update']);
        Route::delete('/products/{product}', [\App\Http\Controllers\ProductController::class, 'destroy']);

    });
});

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/{path}', function () {
        return view('app');
    })->where('path', '^(?!api).*$');
});
