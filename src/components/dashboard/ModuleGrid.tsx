"use client";

import { useRouter } from 'next/navigation';
import PerformanceHub from './PerformanceHub';
import { useTranslation } from '@/lib/useTranslation';

export default function ModuleGrid() {
    const router = useRouter();
    const { t } = useTranslation();

    const modules = [
        { title: t('modules.vokabeln'), icon: '📝', sub: t('modules.vokabeln_sub'), id: 'vokabeln' },
        { title: t('modules.phrases'), icon: '💬', sub: t('modules.phrases_sub'), id: 'phrases' },
        { title: t('modules.quiz'), icon: '❓', sub: t('modules.quiz_sub'), id: 'quiz' },
        { title: t('modules.cyprus'), icon: '🏛️', sub: t('modules.cyprus_sub'), id: 'cyprus' },
        { title: t('modules.video'), icon: '🎥', sub: '', id: 'video' },
        { title: t('modules.audio'), icon: '🎧', sub: '', id: 'audio' },
        { title: t('modules.library'), icon: '📚', sub: '', id: 'library' },
        { title: t('modules.stories'), icon: '📚', sub: t('modules.stories_sub'), id: 'stories' }
    ];

    const handleModuleClick = (id: string) => {
        if (id === 'vokabeln') {
            router.push('/vokabeln');
        } else {
            alert(`Opening module: ${id}`);
        }
    };

    return (
        <div className="modules-grid debug-grid">
            <PerformanceHub />
            {modules.map((m) => (
                <div key={m.id} className="tile" onClick={() => handleModuleClick(m.id)}>
                    <div className="tile-icon">{m.icon}</div>
                    <div className="tile-label">{m.title}</div>
                    {m.sub && <div className="tile-sub">{m.sub}</div>}
                </div>
            ))}
        </div>
    );
}
