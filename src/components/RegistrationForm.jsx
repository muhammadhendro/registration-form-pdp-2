'use client';

import { useState, useEffect, useRef } from 'react';

const InputField = ({ label, name, type = 'text', required = false, value, onChange, isFocused, onFocus, onBlur }) => (
    <div className="w-full group">
        <label className={`block text-sm font-semibold mb-2 transition-colors duration-200 ${isFocused ? 'text-ignite-green' : 'text-gray-300'}`}>
            {label} {required && <span className="text-ignite-green">*</span>}
        </label>
        <input
            type={type}
            name={name}
            value={value}
            onChange={onChange}
            onFocus={onFocus}
            onBlur={onBlur}
            className="w-full px-4 py-3.5 rounded-lg bg-[#2B303E] border border-gray-600 text-white placeholder-gray-400 
                 focus:outline-none focus:border-ignite-green focus:ring-2 focus:ring-ignite-green/20 
                 transition-all duration-300 hover:border-gray-500 shadow-sm"
            required={required}
        />
    </div>
);

const trainingDetails = [
    {
        label: 'Judul Training',
        value: 'Awareness and Training Incident Response'
    },
    {
        label: 'Tanggal',
        value: 'Kamis, 28 Juli 2026'
    },
    {
        label: 'Klien',
        value: 'PT Bridgestone Tire Indonesia'
    }
];

export default function RegistrationForm() {
    const [formData, setFormData] = useState({
        full_name: '',
        company_name: '',
        division_role: '',
        email: '',
        phone_number: ''
    });

    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState(null);
    const [focusedField, setFocusedField] = useState(null);
    const [csrfToken, setCsrfToken] = useState(null);
    const [isSubmitted, setIsSubmitted] = useState(false);

    const wrapperRef = useRef(null);
    useEffect(() => {
        const sendHeight = () => {
            if (wrapperRef.current) {
                const height = wrapperRef.current.offsetHeight + 200;
                window.parent.postMessage({ frameHeight: height }, '*');
            }
        };

        const resizeObserver = new ResizeObserver(() => {
            sendHeight();
        });

        if (wrapperRef.current) {
            resizeObserver.observe(wrapperRef.current);
        }

        sendHeight();

        return () => {
            resizeObserver.disconnect();
        };
    }, []);

    useEffect(() => {
        const fetchToken = async () => {
            try {
                const response = await fetch('/api/get-registration-token', {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });
                
                if (response.ok) {
                    const data = await response.json();
                    setCsrfToken(data.token);
                } else {
                    console.error('Failed to fetch token');
                }
            } catch (error) {
                console.error('Error fetching token:', error);
            }
        };
        
        fetchToken();
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const validateForm = () => {
        const errors = {};
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const nameRegex = /^[a-zA-Z\s\.\-\']+$/;

        if (!formData.full_name) {
            errors.full_name = 'Nama Peserta wajib diisi';
        } else if (formData.full_name.length < 2) {
            errors.full_name = 'Nama Peserta terlalu singkat';
        } else if (!nameRegex.test(formData.full_name)) {
            errors.full_name = 'Nama Peserta mengandung karakter yang tidak valid';
        }

        if (!formData.company_name) {
            errors.company_name = 'Perusahaan wajib diisi';
        } else if (formData.company_name.length < 2) {
            errors.company_name = 'Nama perusahaan terlalu singkat';
        }

        if (!formData.division_role) {
            errors.division_role = 'Divisi / Jabatan wajib diisi';
        }

        if (formData.email && !emailRegex.test(formData.email)) {
            errors.email = 'Alamat email tidak valid';
        }

        return errors;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);

        if (!csrfToken) {
            setMessage({ type: 'error', text: 'Security token not ready. Please refresh the page.' });
            setLoading(false);
            return;
        }

        const validationErrors = validateForm();
        if (Object.keys(validationErrors).length > 0) {
            const firstError = Object.values(validationErrors)[0];
            setMessage({ type: 'error', text: firstError });
            setLoading(false);
            return;
        }

        try {
            const response = await fetch('/api/submit-registration', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    token: csrfToken,
                    formData: {
                        ...formData
                    }
                })
            });

            const result = await response.json();

            if (!response.ok) {
                if (response.status === 429) {
                    throw new Error(result.error || 'Please wait before submitting again.');
                }
                throw new Error(result.error || 'Submission failed');
            }

            setIsSubmitted(true);
            setMessage({ type: 'success', text: '✨ Thank you! Your registration has been submitted successfully.' });
            setFormData({
                full_name: '',
                company_name: '',
                division_role: '',
                email: '',
                phone_number: ''
            });

            const tokenResponse = await fetch('/api/get-registration-token', {
                method: 'GET',
                headers: { 
                    'Content-Type': 'application/json'
                }
            });
            if (tokenResponse.ok) {
                const tokenData = await tokenResponse.json();
                setCsrfToken(tokenData.token);
            }

        } catch (error) {
            console.error('Error submitting form:', error);
            setMessage({ type: 'error', text: error.message || 'Something went wrong. Please try again.' });
        } finally {
            setLoading(false);
        }
    };

    if (isSubmitted) {
        return (
            <div className="w-full h-full bg-[#20242F] text-white p-4 pt-24 md:p-8 md:pt-32 flex items-start justify-center">
                <div ref={wrapperRef} className="max-w-4xl w-full">
                    <div className="bg-[#20242F] rounded-2xl shadow-2xl p-8 md:p-12 text-center border border-gray-700 animate-[fadeInUp_0.5s_ease-out]">
                        <div className="mb-6">
                            <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-ignite-green/20 mb-6">
                                <svg className="h-10 w-10 text-ignite-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">
                                Selesai / Terima Kasih!
                            </h2>
                            <p className="text-gray-300 text-lg md:text-xl leading-relaxed">
                                Form pendaftaran Anda berhasil terkirim.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full h-full bg-[#20242F] text-white p-4 pt-24 md:p-8 md:pt-32 flex items-start justify-center">
            <div ref={wrapperRef} className="max-w-4xl w-full">
                {/* Decorative Elements */}
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                    <div className="absolute top-20 left-10 w-72 h-72 bg-ignite-green/5 rounded-full blur-3xl"></div>
                    <div className="absolute bottom-20 right-10 w-96 h-96 bg-ignite-green/5 rounded-full blur-3xl"></div>
                </div>

                <div className="relative bg-[#20242F]/80 backdrop-blur-sm px-4 pb-6 pt-4 md:px-12 md:pb-12 md:pt-6 md:rounded-2xl md:shadow-2xl md:border border-gray-700 animate-fade-in-up">
                    {/* Header */}
                    <div className="text-center mb-6 pb-4 border-b border-gray-600/50">
                        <h1 className="mx-auto max-w-2xl text-[2rem] leading-tight md:text-4xl font-bold text-white mb-3 tracking-tight">
                            Form Registrasi Training
                        </h1>
                        <div className="mt-5 rounded-2xl border border-gray-600/50 bg-[#2B303E]/50 p-4 sm:p-5">
                            <div className="space-y-4 text-left">
                                {trainingDetails.map(({ label, value }) => (
                                    <div key={label} className="flex flex-col gap-1.5 sm:grid sm:grid-cols-[8.5rem_1rem_minmax(0,1fr)] sm:gap-x-3">
                                        <span className="text-sm font-semibold text-white sm:text-base">{label}</span>
                                        <span className="hidden text-gray-400 sm:block">:</span>
                                        <p className="text-sm leading-6 text-gray-300 sm:text-base sm:leading-7">{value}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Message Alert */}
                    {message && (
                        <div className={`p-5 mb-8 rounded-xl border flex items-center gap-3 animate-fade-in-up ${message.type === 'success'
                            ? 'bg-ignite-green/10 border-ignite-green/30 text-ignite-green'
                            : 'bg-red-500/10 border-red-500/30 text-red-500'
                            }`}>
                            {message.type === 'success' ? (
                                <svg className="w-6 h-6 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            ) : (
                                <svg className="w-6 h-6 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            )}
                            <span className="font-medium">{message.text}</span>
                        </div>
                    )}

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-8">
                        {/* Personal Information Section */}
                        <div className="space-y-6">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-1 h-8 bg-gradient-to-b from-ignite-green to-ignite-green/50 rounded-full"></div>
                                <h2 className="text-xl font-bold text-white">Data Peserta</h2>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <InputField
                                    label="1. Nama Peserta (nama lengkap)"
                                    name="full_name"
                                    required
                                    value={formData.full_name}
                                    onChange={handleChange}
                                    isFocused={focusedField === 'full_name'}
                                    onFocus={() => setFocusedField('full_name')}
                                    onBlur={() => setFocusedField(null)}
                                />
                                <InputField
                                    label="2. Perusahaan"
                                    name="company_name"
                                    required
                                    value={formData.company_name}
                                    onChange={handleChange}
                                    isFocused={focusedField === 'company_name'}
                                    onFocus={() => setFocusedField('company_name')}
                                    onBlur={() => setFocusedField(null)}
                                />
                                <InputField
                                    label="3. Divisi / Jabatan"
                                    name="division_role"
                                    required
                                    value={formData.division_role}
                                    onChange={handleChange}
                                    isFocused={focusedField === 'division_role'}
                                    onFocus={() => setFocusedField('division_role')}
                                    onBlur={() => setFocusedField(null)}
                                />
                                <InputField
                                    label="4. Email (tidak wajib)"
                                    name="email"
                                    type="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    isFocused={focusedField === 'email'}
                                    onFocus={() => setFocusedField('email')}
                                    onBlur={() => setFocusedField(null)}
                                />
                                <InputField
                                    label="5. No. HP (tidak wajib)"
                                    name="phone_number"
                                    type="tel"
                                    value={formData.phone_number}
                                    onChange={handleChange}
                                    isFocused={focusedField === 'phone_number'}
                                    onFocus={() => setFocusedField('phone_number')}
                                    onBlur={() => setFocusedField(null)}
                                />
                            </div>
                        </div>

                        <div className="rounded-xl border border-[#BE45FF]/30 bg-[#BE45FF]/10 px-5 py-4 text-sm text-gray-200">
                            <p className="font-semibold text-white">Catatan:</p>
                            <p className="mt-2 leading-relaxed">
                                &ldquo;Dengan mengisi Absensi ini, Anda menyetujui PT Pijar Edukasi Teknologi (Xynexis Group) akan memproses data pribadi Anda untuk keperluan pencatatan kehadiran dan kebutuhan administrasi&rdquo;
                            </p>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className={`w-full py-4 rounded-xl font-bold text-lg text-white transition-all duration-300 transform 
                         shadow-lg hover:shadow-[#BE45FF]/20 ${loading
                                    ? 'bg-gray-600 cursor-not-allowed opacity-75'
                                    : 'bg-gradient-to-r from-[#BE45FF] to-[#E9BC1E] hover:scale-[1.02] active:scale-[0.98]'
                                } mb-6`}
                        >
                            {loading ? (
                                <span className="flex items-center justify-center gap-3">
                                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Processing...
                                </span>
                            ) : (
                                <span className="flex items-center justify-center gap-2">
                                    Kirim Registrasi
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                    </svg>
                                </span>
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
