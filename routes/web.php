<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\HeroController;
use App\Http\Controllers\PersonalizationController;
use App\Http\Controllers\FeaturesController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\CanadaWarehouseStockController;
use App\Http\Controllers\ApiProductController;
use App\Http\Controllers\AboutPageSectionController;
use App\Http\Controllers\HowWeHelpController;
use App\Http\Controllers\ShopByProductController;
use App\Http\Controllers\ShopByIndustryController;
use App\Http\Controllers\SubCategoryController;
use App\Http\Controllers\StageController;
use App\Http\Controllers\SizeController;
use App\Http\Controllers\ColorController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('home');
});

Route::get('/shop', function () {
    return view('home');
});

Route::get('/singleProduct', function () {
    return view('home');
});

Route::get('/singleProduct/{productId}', function () {
    return view('home');
})->whereNumber('productId');

Route::get('/cart', function () {
    return view('home');
});

Route::get('/checkout', function () {
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
    Route::get('/public/products', [ApiProductController::class, 'index']);
    Route::get('/public/customize-home-page', [\App\Http\Controllers\CustomizeHomeController::class, 'publicShow']);
    Route::get('/public/about-page', [AboutPageSectionController::class, 'publicIndex']);
    Route::post('/personalizations', [PersonalizationController::class, 'store']);
    Route::patch('/personalizations/{personalization}/confirm', [PersonalizationController::class, 'confirm']);

    Route::middleware('auth:sanctum')->group(function () {
        

        Route::get('/user', function (Request $request) {
            return response()->json($request->user());
        });

        Route::post('/logout', [AuthController::class, 'logout']);
        // personalization controller
        Route::get('/personalizations', [PersonalizationController::class, 'index']);
        Route::get('/personalizations/{personalization}', [PersonalizationController::class, 'show']);
        Route::put('/personalizations/{personalization}', [PersonalizationController::class, 'update']);
        Route::delete('/personalizations/{personalization}', [PersonalizationController::class, 'destroy']);
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

        // stage Controller
        Route::apiResource('/stages', StageController::class);

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
