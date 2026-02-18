import { redirect } from 'next/navigation';

/**
 * Legacy /vokabeln route - redirects to mobile vocabulary page
 *
 * This route existed in the old desktop implementation but has been
 * replaced by the mobile-first /m/vocabulary page as part of the
 * mobile-first strategy (established Feb 17, 2026).
 *
 * Redirect maintained for backward compatibility.
 */
export default function VokabelnRedirect() {
    redirect('/m/vocabulary');
}
