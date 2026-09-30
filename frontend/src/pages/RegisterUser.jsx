import { ArrowRight, CheckCircle2, Eye, EyeOff, LockKeyhole, Mail, Store, UserRound } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import { requestRegister } from '../config/UserRequest';

function RegisterUser() {
    const navigate = useNavigate();
    const [showPassword, setShowPassword] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [form, setForm] = useState({ fullname: '', email: '', password: '' });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleChange = (event) => {
        const { name, value } = event.target;
        setForm((current) => ({ ...current, [name]: value }));
        if (error) setError('');
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError('');
        setSuccess('');

        if (!form.fullname.trim() || !form.email.trim() || !form.password) {
            setError('Vui lòng nhập đầy đủ thông tin.');
            return;
        }

        try {
            setIsSubmitting(true);
            await requestRegister({
                fullname: form.fullname.trim(),
                email: form.email.trim(),
                password: form.password,
            });
            setSuccess('Đăng ký thành công! Đang chuyển đến trang đăng nhập...');
            window.setTimeout(() => navigate('/login'), 1400);
        } catch (submitError) {
            setError(submitError.response?.data?.message || 'Đăng ký không thành công. Vui lòng thử lại.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="login-page">
            <Header />
            <main className="login-content">
                <section className="login-panel" aria-labelledby="register-title">
                    <div className="login-brand-mark">
                        <Store size={24} />
                    </div>
                    <p className="login-kicker">Bắt đầu hành trình mua sắm</p>
                    <h1 id="register-title">Tạo tài khoản</h1>
                    <p className="login-intro">Đăng ký để lưu sản phẩm và mua sắm thuận tiện hơn.</p>

                    <form className="login-form" onSubmit={handleSubmit}>
                        {/* Họ và tên */}
                        <label htmlFor="fullname">Họ và tên</label>
                        <div className="login-input-wrap">
                            <UserRound size={18} aria-hidden="true" />
                            <input
                                id="fullname"
                                name="fullname"
                                type="text"
                                value={form.fullname}
                                onChange={handleChange}
                                placeholder="Nguyễn Văn An"
                                autoComplete="name"
                                required
                            />
                        </div>

                        {/* Email */}
                        <label htmlFor="email">Email</label>
                        <div className="login-input-wrap">
                            <Mail size={18} aria-hidden="true" />
                            <input
                                id="email"
                                name="email"
                                type="email"
                                value={form.email}
                                onChange={handleChange}
                                placeholder="you@example.com"
                                autoComplete="email"
                                required
                            />
                        </div>

                        {/* Mật khẩu */}
                        <label htmlFor="password">Mật khẩu</label>
                        <div className="login-input-wrap">
                            <LockKeyhole size={18} aria-hidden="true" />
                            <input
                                id="password"
                                name="password"
                                type={showPassword ? 'text' : 'password'}
                                value={form.password}
                                onChange={handleChange}
                                placeholder="Nhập mật khẩu"
                                autoComplete="new-password"
                                required
                            />
                            <button
                                className="login-password-toggle"
                                type="button"
                                aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                                onClick={() => setShowPassword((visible) => !visible)}
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>

                        {/* Thông báo lỗi & thành công */}
                        {error && (
                            <p className="login-error" role="alert">
                                {error}
                            </p>
                        )}
                        {success && (
                            <p className="login-success" role="status">
                                <CheckCircle2 size={18} aria-hidden="true" />
                                {success}
                            </p>
                        )}

                        {/* Nút submit */}
                        <button className="login-submit" type="submit" disabled={isSubmitting}>
                            {isSubmitting ? 'Đang đăng ký...' : 'Đăng ký'}
                            <ArrowRight size={18} style={{ marginLeft: 8 }} />
                        </button>
                    </form>

                    <p className="login-register">
                        Đã có tài khoản? <Link to="/login">Đăng nhập ngay</Link>
                    </p>
                </section>
            </main>
        </div>
    );
}

export default RegisterUser;
