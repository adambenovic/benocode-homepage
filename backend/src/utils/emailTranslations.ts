// utils/emailTranslations.ts
import { Locale } from '@prisma/client';

interface EmailTranslations {
    // Contact Form
    contactForm: {
        subject: string;
        newLead: string;
        name: string;
        email: string;
        phone: string;
        message: string;
        timestamp: string;
    };
    // Meeting Confirmation - User
    meetingUser: {
        subject: string;
        title: string;
        hello: string;
        confirmed: string;
        details: string;
        date: string;
        time: string;
        duration: string;
        minutes: string;
        notes: string;
        lookForward: string;
        bestRegards: string;
        team: string;
    };
    // Meeting Confirmation - Admin
    meetingAdmin: {
        subject: string;
        title: string;
        name: string;
        email: string;
        phone: string;
        date: string;
        time: string;
        duration: string;
        minutes: string;
        notes: string;
    };
}

const translations: Record<Locale, EmailTranslations> = {
    EN: {
        contactForm: {
            subject: 'New Contact Form Submission - BenoCode',
            newLead: 'New Lead Submission',
            name: 'Name',
            email: 'Email',
            phone: 'Phone',
            message: 'Message',
            timestamp: 'Timestamp',
        },
        meetingUser: {
            subject: 'Meeting Confirmed - BenoCode',
            title: 'Meeting Confirmed',
            hello: 'Hello',
            confirmed: 'Your meeting with BenoCode has been confirmed.',
            details: 'Meeting Details:',
            date: 'Date',
            time: 'Time',
            duration: 'Duration',
            minutes: 'minutes',
            notes: 'Notes',
            lookForward: 'We look forward to speaking with you!',
            bestRegards: 'Best regards',
            team: 'BenoCode Team',
        },
        meetingAdmin: {
            subject: 'New Meeting Scheduled - BenoCode',
            title: 'New Meeting Scheduled',
            name: 'Name',
            email: 'Email',
            phone: 'Phone',
            date: 'Date',
            time: 'Time',
            duration: 'Duration',
            minutes: 'minutes',
            notes: 'Notes',
        },
    },
    SK: {
        contactForm: {
            subject: 'Nový kontaktný formulár - BenoCode',
            newLead: 'Nové odoslanie kontaktu',
            name: 'Meno',
            email: 'Email',
            phone: 'Telefón',
            message: 'Správa',
            timestamp: 'Čas odoslania',
        },
        meetingUser: {
            subject: 'Stretnutie potvrdené - BenoCode',
            title: 'Stretnutie potvrdené',
            hello: 'Dobrý deň',
            confirmed: 'Vaše stretnutie s BenoCode bolo potvrdené.',
            details: 'Detaily stretnutia:',
            date: 'Dátum',
            time: 'Čas',
            duration: 'Trvanie',
            minutes: 'minút',
            notes: 'Poznámky',
            lookForward: 'Tešíme sa na stretnutie s vami!',
            bestRegards: 'S pozdravom',
            team: 'BenoCode Team',
        },
        meetingAdmin: {
            subject: 'Nové naplánované stretnutie - BenoCode',
            title: 'Nové naplánované stretnutie',
            name: 'Meno',
            email: 'Email',
            phone: 'Telefón',
            date: 'Dátum',
            time: 'Čas',
            duration: 'Trvanie',
            minutes: 'minút',
            notes: 'Poznámky',
        },
    },
    DE: {
        contactForm: {
            subject: 'Neues Kontaktformular - BenoCode',
            newLead: 'Neue Kontaktanfrage',
            name: 'Name',
            email: 'E-Mail',
            phone: 'Telefon',
            message: 'Nachricht',
            timestamp: 'Zeitstempel',
        },
        meetingUser: {
            subject: 'Termin bestätigt - BenoCode',
            title: 'Termin bestätigt',
            hello: 'Hallo',
            confirmed: 'Ihr Termin mit BenoCode wurde bestätigt.',
            details: 'Termindetails:',
            date: 'Datum',
            time: 'Zeit',
            duration: 'Dauer',
            minutes: 'Minuten',
            notes: 'Notizen',
            lookForward: 'Wir freuen uns auf das Gespräch mit Ihnen!',
            bestRegards: 'Mit freundlichen Grüßen',
            team: 'BenoCode Team',
        },
        meetingAdmin: {
            subject: 'Neuer Termin geplant - BenoCode',
            title: 'Neuer Termin geplant',
            name: 'Name',
            email: 'E-Mail',
            phone: 'Telefon',
            date: 'Datum',
            time: 'Zeit',
            duration: 'Dauer',
            minutes: 'Minuten',
            notes: 'Notizen',
        },
    },
    CZ: {
        contactForm: {
            subject: 'Nový kontaktní formulář - BenoCode',
            newLead: 'Nové odeslání kontaktu',
            name: 'Jméno',
            email: 'Email',
            phone: 'Telefon',
            message: 'Zpráva',
            timestamp: 'Časové razítko',
        },
        meetingUser: {
            subject: 'Schůzka potvrzena - BenoCode',
            title: 'Schůzka potvrzena',
            hello: 'Dobrý den',
            confirmed: 'Vaše schůzka s BenoCode byla potvrzena.',
            details: 'Detaily schůzky:',
            date: 'Datum',
            time: 'Čas',
            duration: 'Trvání',
            minutes: 'minut',
            notes: 'Poznámky',
            lookForward: 'Těšíme se na setkání s vámi!',
            bestRegards: 'S pozdravem',
            team: 'BenoCode Team',
        },
        meetingAdmin: {
            subject: 'Nová naplánovaná schůzka - BenoCode',
            title: 'Nová naplánovaná schůzka',
            name: 'Jméno',
            email: 'Email',
            phone: 'Telefon',
            date: 'Datum',
            time: 'Čas',
            duration: 'Trvání',
            minutes: 'minut',
            notes: 'Poznámky',
        },
    },
};

export function getEmailTranslation(locale: Locale): EmailTranslations {
    return translations[locale] || translations.EN;
}
