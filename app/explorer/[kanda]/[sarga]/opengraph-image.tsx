import { ImageResponse } from 'next/og';

export const runtime = 'edge';

// Image metadata
export const alt = 'Valmiki Ramayana Sarga Preview';
export const size = {
    width: 1200,
    height: 630,
};

export const contentType = 'image/png';

interface Props {
    params: {
        kanda: string;
        sarga: string;
    };
}

export default async function Image({ params }: Props) {
    const kandaName = decodeURIComponent(params.kanda);
    const sargaNum = params.sarga;

    return new ImageResponse(
        (
            <div
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '100%',
                    height: '100%',
                    backgroundColor: '#fafaf9', // stone-50
                    backgroundImage: 'radial-gradient(circle at 25px 25px, #e7e5e4 2%, transparent 0%), radial-gradient(circle at 75px 75px, #e7e5e4 2%, transparent 0%)',
                    backgroundSize: '100px 100px',
                }}
            >
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '4px solid #d6d3d1', // stone-300
                        padding: '60px 100px',
                        backgroundColor: '#fff',
                        borderRadius: '24px',
                        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
                    }}
                >
                    <div
                        style={{
                            fontSize: 24,
                            color: '#d97706', // amber-600
                            textTransform: 'uppercase',
                            letterSpacing: 4,
                            marginBottom: 20,
                            fontWeight: 600,
                        }}
                    >
                        Tattva • Ramayana
                    </div>

                    <div
                        style={{
                            fontSize: 72,
                            fontFamily: 'serif',
                            color: '#1c1917', // stone-900
                            textAlign: 'center',
                            lineHeight: 1.1,
                            marginBottom: 10,
                        }}
                    >
                        {kandaName}
                    </div>

                    <div
                        style={{
                            fontSize: 48,
                            fontFamily: 'serif',
                            color: '#57534e', // stone-600
                            fontStyle: 'italic',
                        }}
                    >
                        Sarga {sargaNum}
                    </div>
                </div>
            </div>
        ),
        {
            ...size,
        }
    );
}
