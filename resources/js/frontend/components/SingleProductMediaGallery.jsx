export default function SingleProductMediaGallery({ images, selectedImage, onSelectImage }) {
    return (
        <div className="flex flex-col gap-4">
            {/* Main large preview image */}
            <div className="overflow-hidden border border-zinc-200 bg-zinc-100 shadow-[0_16px_44px_rgba(0,0,0,0.08)]">
                <img
                    src={selectedImage}
                    alt="Corporate full sleeve t-shirt"
                    className="h-[500px] w-full object-cover object-center sm:h-[580px] xl:h-[640px]"
                />
            </div>

            {/* Thumbnail list shown underneath the main image horizontally */}
            <div className="grid grid-cols-6 gap-3">
                {images.map((image, index) => (
                    <button
                        key={index}
                        type="button"
                        onClick={() => onSelectImage(image)}
                        className={`block overflow-hidden border bg-zinc-100 transition-colors ${
                            selectedImage === image
                                ? 'border-zinc-950 ring-1 ring-zinc-950'
                                : 'border-zinc-200 hover:border-zinc-500 opacity-70 hover:opacity-100'
                        }`}
                        aria-label="Select product image"
                    >
                        <img
                            src={image}
                            alt="Product thumbnail"
                            className="h-[80px] w-full object-cover object-center sm:h-[96px]"
                        />
                    </button>
                ))}
            </div>
        </div>
    );
}