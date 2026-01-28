'use client';

import { useState } from 'react';
import { usePostHog } from 'posthog-js/react';
import { ArrowRight, Mail, Loader2 } from 'lucide-react';

interface LeadCaptureModalProps {
    isOpen: boolean;
    onComplete: () => void;
}

export function LeadCaptureModal({ isOpen, onComplete }: LeadCaptureModalProps) {
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const posthog = usePostHog();

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        // Basic validation
        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            setError('Please enter a valid email address.');
            setIsLoading(false);
            return;
        }

        try {
            // 1. Identify User in PostHog
            posthog?.identify(email, {
                email: email,
                source: 'web_lead_gen'
            });

            posthog?.capture('lead_captured', { email });

            // 2. Save to LocalStorage to prevent re-asking
            localStorage.setItem('user_email', email);

            // 3. Complete
            onComplete();
        } catch (err) {
            console.error('Lead capture error:', err);
            // Fallback: even if analytics fail, let them proceed locally
            localStorage.setItem('user_email', email);
            onComplete();
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 relative animate-in zoom-in-95 duration-300 border border-stone-100">

                <div className="text-center space-y-4 mb-8">
                    <div className="w-12 h-12 bg-amber-50 rounded-full flex items-center justify-center mx-auto text-amber-600 mb-2">
                        <Mail className="w-6 h-6" />
                    </div>
                    <h2 className="text-2xl font-serif font-medium text-stone-900">
                        Begin Your Journey into the Adi Kavya
                    </h2>
                    <p className="text-stone-500 text-sm leading-relaxed">
                        Tattva is a research project dedicated to verifiable AI. To continue exploring the Ramayana and save your conversation history, please share your email. We respect your privacy and will never spam.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <input
                            type="email"
                            placeholder="name@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none transition-all placeholder:text-stone-300 text-stone-800"
                            autoFocus
                        />
                        {error && (
                            <p className="text-red-500 text-xs pl-1 animate-in slide-in-from-top-1">
                                {error}
                            </p>
                        )}
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-stone-900 hover:bg-stone-800 text-white font-medium py-3 rounded-xl transition-all flex items-center justify-center gap-2 group disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {isLoading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <>
                                <span>Continue</span>
                                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                            </>
                        )}
                    </button>

                    <p className="text-[10px] text-center text-stone-400">
                        By continuing, you agree to receive updates about Tattva.
                    </p>
                </form>
            </div>
        </div>
    );
}
