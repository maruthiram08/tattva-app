import { useState, useEffect } from 'react';

export function useTypewriter(
    phrases: string[],
    typingSpeed = 50,
    deletingSpeed = 30,
    pauseDuration = 2000
) {
    const [text, setText] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);
    const [phraseIndex, setPhraseIndex] = useState(0);

    useEffect(() => {
        const currentPhrase = phrases[phraseIndex];

        const tick = () => {
            if (isDeleting) {
                setText((prev) => prev.slice(0, -1));
            } else {
                setText((prev) => currentPhrase.slice(0, prev.length + 1));
            }
        };

        const speed = isDeleting ? deletingSpeed : typingSpeed;

        // Determine strict timing
        let timer: NodeJS.Timeout;

        if (!isDeleting && text === currentPhrase) {
            // Finished typing, pause
            timer = setTimeout(() => setIsDeleting(true), pauseDuration);
        } else if (isDeleting && text === '') {
            // Finished deleting, move to next phrase
            setIsDeleting(false);
            setPhraseIndex((prev) => (prev + 1) % phrases.length);
        } else {
            // Typing or deleting characters
            timer = setTimeout(tick, speed);
        }

        return () => clearTimeout(timer);
    }, [text, isDeleting, phraseIndex, phrases, typingSpeed, deletingSpeed, pauseDuration]);

    return text;
}
