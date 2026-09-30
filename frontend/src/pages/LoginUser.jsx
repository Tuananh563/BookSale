import { ArrowRight, CheckCircle2, Eye, EyeOff, LockKeyhole, Mail, Store } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import { requestLogin } from '../config/UserRequest';
import { useStore } from '../hooks/useStore';

function LoginUser() {
    const navigate = useNavigate();
    const { refreshAuth } = useStore();
    const [form, setForm] = useState({ email: '', password: '' });
    const [showPassword, setShowPassword] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
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
        if (!form.email.trim() || !form.password) {
            setError('Vui lòng nhập đầy đủ email và mật khẩu.');
            return;
        }

        try {
            setIsSubmitting(true);
            await requestLogin({ email: form.email.trim(), password: form.password });
            await refreshAuth();
            setSuccess('Đăng nhập thành công!');
            window.setTimeout(() => navigate('/', { replace: true }), 1200);
        } catch (submitError) {
            setError(
                submitError.response?.data?.message || 'Đăng nhập không thành công. Vui lòng kiểm tra lại thông tin.',
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="login-page">
            <Header />
            <main className="login-content">
                <section className="login-panel" aria-labelledby="login-title">
                    <div className="login-brand-mark">
                        <Store size={24} />
                    </div>
                    <p className="login-kicker">Chào mừng trở lại</p>
                    <h1 id="login-title">Đăng nhập tài khoản</h1>
                    <p className="login-intro">Tiếp tục mua sắm những sản phẩm bạn yêu thích.</p>

                    <form className="login-form" onSubmit={handleSubmit}>
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
                        <div className="login-label-row">
                            <label htmlFor="password">Mật khẩu</label>
                            <Link className="login-forgot" to="/forgot-password" state={{ email: form.email }}>
                                Quên mật khẩu?
                            </Link>
                        </div>
                        <div className="login-input-wrap">
                            <LockKeyhole size={18} aria-hidden="true" />
                            <input
                                id="password"
                                name="password"
                                type={showPassword ? 'text' : 'password'}
                                value={form.password}
                                onChange={handleChange}
                                placeholder="Nhập mật khẩu"
                                autoComplete="current-password"
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
                        <button className="login-submit" type="submit" disabled={isSubmitting}>
                            {isSubmitting ? 'Đang đăng nhập...' : 'Đăng nhập'}
                            {!isSubmitting && <ArrowRight size={18} />}
                        </button>
                    </form>
                    <p className="login-register">
                        Chưa có tài khoản? <Link to="/register">Đăng ký ngay</Link>
                    </p>
                </section>
            </main>
        </div>
    );
}

export default LoginUser;
