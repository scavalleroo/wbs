import { redirect } from 'next/navigation';

export const metadata = {
    title: 'Notes | Weko',
    description: 'Your calm space for productivity, powered by AI',
};

export default function NotesPage() {
    // Redirect to dashboard since notes are now integrated there
    redirect('/dashboard');
}