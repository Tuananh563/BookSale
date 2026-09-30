import { ArrowLeft, ArrowRight, CheckCircle2, LockKeyhole, Mail, Store } from 'lucide-react';
import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import Header from '../components/Header';
import { requestForgotPassword, requestVerifyForgotPassword } from '../config/UserRequest';

function ForgotPassword() {
    const location = useLocation();
    const [email, setEmail] = useState(location.state?.email || '');
    const [otp, setOtp] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [step, setStep] = useState('email');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    const handleSendCode = async (event) => {
        event.preventDefault();
        setError('');

        if (!email.trim()) {
            setError('Vui lòng nhập email đã đăng ký.');
            return;
        }

        try {
            setIsSubmitting(true);
            await requestForgotPassword({ email: email.trim() });
            setStep('verify');
        } catch (submitError) {
            setError(submitError.response?.data?.message || 'Không thể gửi mã OTP. Vui lòng thử lại.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleResetPassword = async (event) => {
        event.preventDefault();
        setError('');

        if (!/^\d{6}$/.test(otp)) {
            setError('Mã OTP phải gồm 6 chữ số.');
            return;
        }
        if (!password) {
            setError('Vui lòng nhập mật khẩu mới.');
            return;
        }
        if (password !== confirmPassword) {
            setError('Mật khẩu xác nhận không khớp.');
            return;
        }

        try {
            setIsSubmitting(true);
            await requestVerifyForgotPassword({ otp, password });
            setStep('complete');
        } catch (submitError) {
            setError(submitError.response?.data?.message || 'Không thể đặt lại mật khẩu. Vui lòng thử lại.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="login-page">
            <Header />
            <main className="login-content">
                <section className="login-panel" aria-labelledby="forgot-password-title">
                    <div className="login-brand-mark">
                        {step === 'complete' ? <CheckCircle2 size={24} /> : <Store size={24} />}
                    </div>
                    <p className="login-kicker">Khôi phục tài khoản</p>
                    <h1 id="forgot-password-title">
                        {step === 'email' && 'Quên mật khẩu?'}
                        {step === 'verify' && 'Tạo mật khẩu mới'}
                        {step === 'complete' && 'Đổi mật khẩu thành công'}
                    </h1>
                    <p className="login-intro">
                        {step === 'email' && 'Nhập email đã đăng ký để nhận mã xác nhận đặt lại mật khẩu.'}
                        {step === 'verify' && `Mã xác nhận đã được gửi đến ${email.trim()}.`}
                        {step === 'complete' && 'Mật khẩu của bạn đã được cập nhật. Hãy đăng nhập lại.'}
                    </p>

                    {step === 'email' && (
                        <form className="login-form" onSubmit={handleSendCode}>
                            <label htmlFor="forgot-email">Email</label>
                            <div className="login-input-wrap">
                                <Mail size={18} aria-hidden="true" />
                                <input
                                    id="forgot-email"
                                    type="email"
                                    value={email}
                                    onChange={(event) => setEmail(event.target.value)}
                                    placeholder="you@example.com"
                                    autoComplete="email"
                                    required
                                />
                            </div>
                            {error && (
                                <p className="login-error" role="alert">
                                    {error}
                                </p>
                            )}
                            <button className="login-submit" type="submit" disabled={isSubmitting}>
                                {isSubmitting ? 'Đang gửi mã...' : 'Gửi mã xác nhận'}
                                {!isSubmitting && <ArrowRight size={18} />}
                            </button>
                        </form>
                    )}

                    {step === 'verify' && (
                        <form className="login-form" onSubmit={handleResetPassword}>
                            <label htmlFor="forgot-otp">Mã OTP</label>
                            <div className="login-input-wrap">
                                <input
                                    id="forgot-otp"
                                    type="text"
                                    inputMode="numeric"
                                    autoComplete="one-time-code"
                                    pattern="[0-9]{6}"
                                    maxLength={6}
                                    value={otp}
                                    onChange={(event) => setOtp(event.target.value.replace(/\D/g, '').slice(0, 6))}
                                    placeholder="Nhập mã 6 chữ số"
                                    required
                                />
                            </div>
                            <label htmlFor="new-password">Mật khẩu mới</label>
                            <div className="login-input-wrap">
                                <LockKeyhole size={18} aria-hidden="true" />
                                <input
                                    id="new-password"
                                    type="password"
                                    autoComplete="new-password"
                                    value={password}
                                    onChange={(event) => setPassword(event.target.value)}
                                    placeholder="Nhập mật khẩu mới"
                                    required
                                />
                            </div>
                            <label htmlFor="confirm-password">Xác nhận mật khẩu</label>
                            <div className="login-input-wrap">
                                <LockKeyhole size={18} aria-hidden="true" />
                                <input
                                    id="confirm-password"
                                    type="password"
                                    autoComplete="new-password"
                                    value={confirmPassword}
                                    onChange={(event) => setConfirmPassword(event.target.value)}
                                    placeholder="Nhập lại mật khẩu mới"
                                    required
                                />
                            </div>
                            {error && (
                                <p className="login-error" role="alert">
                                    {error}
                                </p>
                            )}
                            <button className="login-submit" type="submit" disabled={isSubmitting}>
                                {isSubmitting ? 'Đang cập nhật...' : 'Đặt lại mật khẩu'}
                                {!isSubmitting && <ArrowRight size={18} />}
                            </button>
                            <div className="forgot-password__controls">
                                <button type="button" onClick={() => setStep('email')}>
                                    <ArrowLeft size={14} aria-hidden="true" /> Đổi email
                                </button>
                                <button type="button" onClick={handleSendCode} disabled={isSubmitting}>
                                    Gửi lại mã
                                </button>
                            </div>
                        </form>
                    )}

                    {step === 'complete' && (
                        <div className="login-form">
                            <p className="login-success" role="status">
                                <CheckCircle2 size={18} aria-hidden="true" />
                                Mật khẩu mới đã được lưu.
                            </p>
                            <Link className="login-submit" to="/login">
                                Đến trang đăng nhập <ArrowRight size={18} />
                            </Link>
                        </div>
                    )}

                    {step !== 'complete' && (
                        <p className="login-register">
                            <Link to="/login">Quay lại đăng nhập</Link>
                        </p>
                    )}
                </section>
            </main>
        </div>
    );
}

export default ForgotPassword;
