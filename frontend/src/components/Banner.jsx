import SliderPkg from 'react-slick';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';

import banner1 from '../assets/images/banner1.webp';
import banner2 from '../assets/images/banner2.webp';
import banner3 from '../assets/images/banner3.webp';

const Slider = SliderPkg.default || SliderPkg;

// Nút bấm Next/Prev tùy chỉnh
const NextArrow = ({ onClick }) => (
    <button
        onClick={onClick}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-10 bg-black/30 hover:bg-black/60 text-white p-3 rounded-full transition-all opacity-0 group-hover:opacity-100 backdrop-blur-sm"
    >
        <FaChevronRight size={18} />
    </button>
);

const PrevArrow = ({ onClick }) => (
    <button
        onClick={onClick}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-10 bg-black/30 hover:bg-black/60 text-white p-3 rounded-full transition-all opacity-0 group-hover:opacity-100 backdrop-blur-sm"
    >
        <FaChevronLeft size={18} />
    </button>
);

function Banner() {
    const banners = [
        {
            url: banner1,
            title: 'Bộ Sưu Tập Mùa Hè 2026',
            subtitle: 'Khám phá các thiết kế thời thượng nhất',
            ctaText: 'Khám phá ngay',
            link: 'https://minhlongbook.vn/products/sach-combo-3-cuon-boi-duong-tu-duy-tai-chinh-cho-hoc-sinh-tieu-hoc',
        },
        {
            url: banner2,
            title: 'Ưu Đãi Đặc Biệt Giảm 50%',
            subtitle: 'Áp dụng cho tất cả sản phẩm mới về',
            ctaText: 'Mua ngay',
            link: '/sale',
        },
        {
            url: banner3,
            title: 'Phong Cách Độc Bản',
            subtitle: 'Nâng tầm tủ đồ của bạn hôm nay',
            ctaText: 'Xem chi tiết',
            link: '/collections',
        },
    ];

    const settings = {
        dots: true,
        infinite: true,
        speed: 700,
        slidesToShow: 1,
        slidesToScroll: 1,
        autoplay: true,
        autoplaySpeed: 5000,
        pauseOnHover: true,
        nextArrow: <NextArrow />,
        prevArrow: <PrevArrow />,
        appendDots: (dots) => (
            <div style={{ bottom: '20px' }}>
                <ul className="flex justify-center gap-2 m-0"> {dots} </ul>
            </div>
        ),
        customPaging: () => (
            <div className="w-3 h-3 rounded-full bg-white/50 hover:bg-white transition-all [.slick-active_&]:bg-white [.slick-active_&]:w-8" />
        ),
    };

    return (
        <div className="relative w-full max-w-[1920px] mx-auto overflow-hidden group">
            <Slider {...settings}>
                {banners.map((item, index) => (
                    <div key={index} className="relative outline-none">
                        {/* Hình ảnh banner */}
                        <div className="relative h-[400px] sm:h-[500px] md:h-[600px] w-full">
                            <img className="w-full h-full object-cover object-center" src={item.url} alt={item.title} />
                            {/* Lớp phủ Gradient giúp nổi bật văn bản */}
                            <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/30 to-transparent" />
                        </div>

                        {/* Nội dung Banner */}
                        <div className="absolute inset-0 flex flex-col justify-center items-start px-8 sm:px-16 md:px-24 text-white max-w-2xl">
                            <h2 className="text-3xl sm:text-5xl font-bold tracking-tight mb-4 animate-fade-in drop-shadow-md">
                                {item.title}
                            </h2>
                            <p className="text-base sm:text-lg text-gray-200 mb-6 drop-shadow">{item.subtitle}</p>
                            <a
                                href={item.link}
                                className="inline-block bg-white text-black font-semibold px-6 py-3 rounded-full hover:bg-gray-200 hover:scale-105 active:scale-95 transition-all shadow-lg"
                            >
                                {item.ctaText}
                            </a>
                        </div>
                    </div>
                ))}
            </Slider>
        </div>
    );
}

export default Banner;
