import { useRouter } from 'next/navigation';
import PerformanceHub from './PerformanceHub';

const modules = [
    { title: 'Vokabeln', icon: '📝', sub: '12 Due', id: 'vokabeln' },
    { title: 'Phrases', icon: '💬', sub: 'Travel', id: 'phrases' },
    { title: 'Quiz', icon: '❓', sub: 'Reading', id: 'quiz' },
    { title: 'Cyprus', icon: '🏛️', sub: 'Exam Prep', id: 'cyprus' },
    { title: 'Video Class', icon: '🎥', sub: '', id: 'video' },
    { title: 'Audio', icon: '🎧', sub: '', id: 'audio' },
    { title: 'Library', icon: '📚', sub: '', id: 'library' },
    { title: 'Stories', icon: '📚', sub: 'Short Stories', id: 'stories' }
];

export default function ModuleGrid() {
    const router = useRouter();

    const handleModuleClick = (id: string) => {
        if (id === 'vokabeln') {
            router.push('/vokabeln');
        } else {
            alert(`Opening module: ${id}`);
        }
    };

    return (
        <div className="modules-grid">
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
