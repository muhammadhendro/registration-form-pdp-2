'use client';

import { useEffect, useRef, useState } from 'react';

const fieldClassName = `
    w-full rounded-2xl border border-[#d7dde5] bg-white px-4 py-3.5 text-[15px] text-[#20242F]
    shadow-[0_10px_30px_rgba(32,36,47,0.06)] transition-all duration-300
    placeholder:text-[#8A909B] hover:border-[#c2ccd8]
    focus:border-[#90C343] focus:outline-none focus:ring-4 focus:ring-[#90C343]/15
`;

const sectionHeadingClassName =
    'text-sm font-semibold uppercase tracking-[0.22em] text-[#90C343]';

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

const InputField = ({
    label,
    name,
    type = 'text',
    required = false,
    value,
    onChange,
    isFocused,
    onFocus,
    onBlur
}) => (
    <div className="w-full">
        <label
            className={`mb-2 block text-sm font-semibold transition-colors duration-200 ${
                isFocused ? 'text-[#90C343]' : 'text-[#20242F]'
            }`}
        >
            {label} {required && <span className="text-[#BE45FF]">*</span>}
        </label>
        <input
            type={type}
            name={name}
            value={value}
            onChange={onChange}
            onFocus={onFocus}
            onBlur={onBlur}
            className={fieldClassName}
            required={required}
        />
    </div>
);

const SectionHeader = ({ title, description }) => (
    <div className="flex items-start gap-4">
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#90C343]/12 shadow-inner shadow-[#90C343]/10">
            <span className="h-3 w-3 rounded-full bg-gradient-to-r from-[#BE45FF] to-[#E9BC1E]" />
        </div>
        <div>
            <p className={sectionHeadingClassName}>{title}</p>
            {description ? <p className="text-sm leading-6 text-[#667085]">{description}</p> : null}
        </div>
    </div>
);

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
        setFormData((prev) => ({
            ...prev,
            [name]: value
        }));
    };

    const validateForm = () => {
        const errors = {};
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const nameRegex = /^[a-zA-Z\s.\-']+$/;

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
            setMessage({ type: 'error', text: 'Token keamanan belum siap. Silakan muat ulang halaman.' });
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
                    throw new Error(result.error || 'Mohon tunggu sebentar sebelum mengirim ulang.');
                }
                throw new Error(result.error || 'Pengiriman formulir gagal.');
            }

            setIsSubmitted(true);
            setMessage({ type: 'success', text: 'Terima kasih! Registrasi Anda berhasil dikirim.' });
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
            setMessage({ type: 'error', text: error.message || 'Terjadi kendala. Silakan coba lagi.' });
        } finally {
            setLoading(false);
        }
    };

    if (isSubmitted) {
        return (
            <div
                className="w-full bg-gradient-to-b from-white via-[#FAFBFC] to-[#F1F4F8] px-4 py-6 text-[#20242F] md:px-8 md:py-10"
                style={{ fontFamily: 'Roboto, Arial, sans-serif' }}
            >
                <div ref={wrapperRef} className="mx-auto max-w-4xl">
                    <div className="relative overflow-hidden rounded-[28px] border border-[#E4E7EC] bg-white px-6 py-10 text-center shadow-[0_24px_80px_rgba(32,36,47,0.08)] md:px-12 md:py-14">
                        <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-[#BE45FF] via-[#E9BC1E] to-[#90C343]" />
                        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-[#90C343]/12 shadow-inner shadow-[#90C343]/10">
                            <svg className="h-10 w-10 text-[#90C343]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h2 className="text-3xl font-bold tracking-[-0.02em] text-[#20242F] md:text-4xl">
                            Selesai / Terima Kasih!
                        </h2>
                        <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-[#667085] md:text-lg">
                            Form registrasi Anda berhasil terkirim dan sudah tercatat sebagai data baru.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div
            className="w-full bg-gradient-to-b from-white via-[#FAFBFC] to-[#F1F4F8] px-4 py-6 text-[#20242F] md:px-8 md:py-10"
            style={{ fontFamily: 'Roboto, Arial, sans-serif' }}
        >
            <div ref={wrapperRef} className="mx-auto max-w-5xl">
                <div className="relative overflow-hidden rounded-[28px] border border-[#E4E7EC] bg-white px-4 pb-6 pt-5 shadow-[0_24px_80px_rgba(32,36,47,0.08)] sm:px-6 md:px-12 md:pb-12 md:pt-8">
                    <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-[#BE45FF] via-[#E9BC1E] to-[#90C343]" />
                    <div className="pointer-events-none absolute -left-12 top-20 h-44 w-44 rounded-full bg-[#BE45FF]/10 blur-3xl" />
                    <div className="pointer-events-none absolute -right-12 bottom-16 h-48 w-48 rounded-full bg-[#E9BC1E]/14 blur-3xl" />

                    <div className="relative border-b border-[#EAECF0] pb-8">
                        <p className={sectionHeadingClassName}>IGNITE Training Form</p>
                        <h1 className="mt-3 max-w-3xl text-[2rem] font-bold leading-tight tracking-[-0.03em] text-[#20242F] md:text-[2.7rem]">
                            Form Registrasi Training
                        </h1>
                        <p className="mt-3 max-w-3xl text-sm leading-7 text-[#667085] md:text-base">
                            Isi data peserta berikut untuk pencatatan kehadiran training dan kebutuhan administrasi.
                        </p>

                        <div className="mt-6 rounded-[24px] border border-[#EAECF0] bg-[linear-gradient(180deg,#FFFFFF_0%,#F7F8FA_100%)] p-5 sm:p-6">
                            <div className="grid gap-4 text-left">
                                {trainingDetails.map(({ label, value }) => (
                                    <div
                                        key={label}
                                        className="flex flex-col gap-1.5 sm:grid sm:grid-cols-[8.5rem_1rem_minmax(0,1fr)] sm:gap-x-3"
                                    >
                                        <span className="text-sm font-semibold text-[#20242F] sm:text-base">{label}</span>
                                        <span className="hidden text-[#98A2B3] sm:block">:</span>
                                        <p className="text-sm leading-6 text-[#667085] sm:text-base sm:leading-7">{value}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {message && (
                        <div
                            className={`relative mt-8 flex items-center gap-3 rounded-2xl border px-5 py-4 ${
                                message.type === 'success'
                                    ? 'border-[#B7E08A] bg-[#F4FBE9] text-[#5B8C17]'
                                    : 'border-[#F2B8B5] bg-[#FFF1F0] text-[#C5322A]'
                            }`}
                        >
                            {message.type === 'success' ? (
                                <svg className="h-6 w-6 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                    />
                                </svg>
                            ) : (
                                <svg className="h-6 w-6 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                    />
                                </svg>
                            )}
                            <span className="font-medium">{message.text}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="relative mt-8 space-y-10">
                        <section className="space-y-6">
                            <SectionHeader
                                title="Data Peserta"
                                description="Mohon isi data berikut dengan lengkap agar registrasi Anda dapat diproses."
                            />

                            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
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
                        </section>

                        <div className="rounded-[24px] border border-[#E8D9FA] bg-[linear-gradient(135deg,rgba(190,69,255,0.08)_0%,rgba(233,188,30,0.08)_100%)] px-5 py-5 text-sm text-[#4D5761]">
                            <p className="font-semibold uppercase tracking-[0.18em] text-[#7B3FB3]">Catatan</p>
                            <p className="mt-3 leading-7">
                                &ldquo;Dengan mengisi Absensi ini, Anda menyetujui PT Pijar Edukasi Teknologi
                                (Xynexis Group) akan memproses data pribadi Anda untuk keperluan pencatatan
                                kehadiran dan kebutuhan administrasi&rdquo;
                            </p>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className={`w-full rounded-2xl px-6 py-4 text-lg font-bold text-white transition-all duration-300 ${
                                loading
                                    ? 'cursor-not-allowed bg-[#98A2B3] opacity-80'
                                    : 'bg-gradient-to-r from-[#BE45FF] via-[#CF6EAF] to-[#E9BC1E] shadow-[0_18px_40px_rgba(190,69,255,0.22)] hover:-translate-y-0.5 hover:shadow-[0_22px_48px_rgba(190,69,255,0.28)] active:translate-y-0'
                            }`}
                        >
                            {loading ? (
                                <span className="flex items-center justify-center gap-3">
                                    <svg className="h-5 w-5 animate-spin text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path
                                            className="opacity-75"
                                            fill="currentColor"
                                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                        />
                                    </svg>
                                    Memproses...
                                </span>
                            ) : (
                                <span className="flex items-center justify-center gap-2">
                                    Kirim Registrasi
                                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
