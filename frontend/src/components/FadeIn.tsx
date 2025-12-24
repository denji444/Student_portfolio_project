import { useEffect, useState } from 'react';

type Props = {
	children: any;
	delayMs?: number;
};

export default function FadeIn({ children, delayMs = 0 }: Props) {
	const [visible, setVisible] = useState(false);
	useEffect(() => {
		const t = setTimeout(() => setVisible(true), delayMs);
		return () => clearTimeout(t);
	}, [delayMs]);

	return (
		<div
			className={`transition-all duration-500 ease-out ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}
		>
			{children}
		</div>
	);
}


