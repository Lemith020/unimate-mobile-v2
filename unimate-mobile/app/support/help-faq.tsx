import React, { useState } from 'react';
import {
    Alert,
    Linking,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

// Add your real support details here. WhatsApp needs the country code,
// without spaces or a plus sign (for example, 947XXXXXXXX).
const SUPPORT_EMAIL: string = 'lemithnanditha41@gmail.com';
const SUPPORT_WHATSAPP: string = '0768092970';
const ORANGE = '#EA580C';

type FAQCategory = {
    title: string;
    icon: React.ComponentProps<typeof Ionicons>['name'];
    color: string;
    tint: string;
    questions: { question: string; answer: string }[];
};

const FAQ_CATEGORIES: FAQCategory[] = [
    {
        title: 'Getting started',
        icon: 'rocket-outline',
        color: '#0F766E',
        tint: '#CCFBF1',
        questions: [
            {
                question: 'What is Unimate?',
                answer: 'Unimate is an app for university students. Find boardings, order food, locate pharmacies, health centers and essential services near campus, check transport options, and buy or sell used items, all in one place.',
            },
            {
                question: 'Do I need an account to use Unimate?',
                answer: 'No. You can browse boardings, shops, pharmacies, health centers and services without an account. You need to log in to apply for a boarding, place an order, chat, save items or sell items.',
            },
        ],
    },
    {
        title: 'Account & Profile',
        icon: 'person-outline',
        color: '#2563EB',
        tint: '#DBEAFE',
        questions: [
            {
                question: 'How do I create an account?',
                answer: 'Tap Profile, then Register. Enter your name, university email, phone number and a password. You can also register when you try an action that needs login, such as applying for a boarding.',
            },
            {
                question: 'How do I edit my profile?',
                answer: 'Open the Profile tab and tap the edit icon (✏️). Update your photo, name, phone number, university, faculty, year, or location, then tap Save. Your email cannot be changed.',
            },
            {
                question: 'I forgot my password. What should I do?',
                answer: 'On the login screen, tap “Forgot password” and follow the steps to reset it.',
            },
            {
                question: 'How do I delete my account?',
                answer: 'Open Profile and tap “Delete account”. This permanently removes your account and data, so it cannot be undone.',
            },
        ],
    },
    {
        title: 'Boardings',
        icon: 'home-outline',
        color: '#2563EB',
        tint: '#DBEAFE',
        questions: [
            {
                question: 'How do I find a boarding?',
                answer: 'Open Boardings from the Home screen. Use search and filters such as price, distance from campus, boys or girls, and facilities. You can also see boardings on the map in the Explore tab.',
            },
            {
                question: 'How do I apply for a boarding?',
                answer: 'Open a boarding, tap Apply, enter your move-in date and a short message, then submit. You need to be logged in. The owner will review your application, and their phone number is shown to you once you apply. You can also chat with the owner before applying.',
            },
            {
                question: 'How do I check my application status?',
                answer: 'Open the menu (☰) and tap My Applications. Your application will show as Submitted, Viewed, Accepted or Rejected.',
            },
            {
                question: 'What does the “Verified” badge mean?',
                answer: 'It means the Unimate team has checked the owner or listing. We still recommend visiting the place and seeing it yourself before paying any deposit.',
            },
        ],
    },
    {
        title: 'Food orders',
        icon: 'restaurant-outline',
        color: '#EA580C',
        tint: '#FFEDD5',
        questions: [
            {
                question: 'How do I place a food order?',
                answer: 'Open Food from the Home screen, choose a shop, add items to your cart, then tap Checkout. Choose Pickup or Delivery and place your order. You can follow its progress in My Orders (Placed, Accepted, Preparing, Ready, Completed).',
            },
            {
                question: 'How do I pay for my order?',
                answer: 'You pay the shop directly in cash when you pick up or receive your order. Online payments are not available yet.',
            },
            {
                question: 'Can I cancel an order?',
                answer: 'You can cancel while the order is still “Placed”, before the shop accepts it. After that, please contact the shop directly.',
            },
        ],
    },
    {
        title: 'Pharmacy & Health',
        icon: 'medkit-outline',
        color: '#15803D',
        tint: '#DCFCE7',
        questions: [
            {
                question: 'How do I find a nearby pharmacy or health center?',
                answer: 'Open Pharmacy or Health from the Home screen, or use the map in the Explore tab. You can see the distance, opening hours, and tap to call or get directions.',
            },
            {
                question: 'Can I buy medicine through Unimate?',
                answer: 'Not at the moment. You can check whether a pharmacy has a medicine available, then call or visit them. Unimate does not give medical advice. Please consult a doctor or pharmacist about your medicines.',
            },
            {
                question: 'What should I do in an emergency?',
                answer: 'Use the Emergency strip on the Home screen to call 1990 (ambulance). It works without logging in. For police call 119, and for fire and rescue call 110.',
            },
        ],
    },
    {
        title: 'Marketplace',
        icon: 'cart-outline',
        color: '#B45309',
        tint: '#FEF3C7',
        questions: [
            {
                question: 'How do I sell an item?',
                answer: 'Open Marketplace and tap + Sell. Add photos, a title, price and condition, then post. You need to be logged in.',
            },
            {
                question: 'How do I buy an item safely?',
                answer: 'Open the item and chat with the seller to agree on the price and a meeting time. Unimate does not handle payments between users. Meet in a safe public place, such as the campus, and check the item before paying.',
            },
        ],
    },
    {
        title: 'Transport',
        icon: 'bus-outline',
        color: '#7C3AED',
        tint: '#EDE9FE',
        questions: [
            {
                question: 'How do I check bus or train schedules?',
                answer: 'Open Transport from the Home screen and search by where you are travelling from and to. Schedules can change, so please confirm with the operator if you are unsure.',
            },
        ],
    },
    {
        title: 'Location & Privacy',
        icon: 'location-outline',
        color: '#0F766E',
        tint: '#CCFBF1',
        questions: [
            {
                question: 'Why does Unimate ask for my location?',
                answer: 'To show boardings, shops and services near you, and the distance to each one. It is optional. You can type your address instead.',
            },
            {
                question: 'Can other users see my location?',
                answer: 'No. Other users never see your exact GPS location or full address. Owners and sellers only see the general area, such as your city.',
            },
        ],
    },
    {
        title: 'Technical issues',
        icon: 'construct-outline',
        color: '#DC2626',
        tint: '#FEE2E2',
        questions: [
            {
                question: 'I am not receiving notifications. What can I do?',
                answer: 'Check that notifications are allowed for Unimate in your phone settings, and that they are turned on in the menu under Notification settings. Make sure your phone has an internet connection.',
            },
            {
                question: 'The app is slow or not loading. What can I do?',
                answer: 'Check your internet connection and pull down on the screen to refresh. Make sure you have the latest version of the app. If the problem continues, open the menu and tap “Report a problem”.',
            },
            {
                question: 'How do I report a suspicious listing or user?',
                answer: 'Open the listing or profile, tap the ⋯ menu and choose Report. Our team will review it.',
            },
        ],
    },
];

export default function HelpFAQScreen() {
    const router = useRouter();
    const [openQuestion, setOpenQuestion] = useState<string | null>(null);

    const openSupport = async (channel: 'email' | 'whatsapp') => {
        const contact = channel === 'email' ? SUPPORT_EMAIL : SUPPORT_WHATSAPP;
        if (!contact.trim()) {
            Alert.alert('Support unavailable', 'Support contact details will be available soon.');
            return;
        }

        const url = channel === 'email'
            ? `mailto:${contact.trim()}?subject=${encodeURIComponent('Unimate support')}`
            : `https://wa.me/${contact.replace(/\D/g, '')}?text=${encodeURIComponent('Hi Unimate! I need some help.')}`;

        try {
            await Linking.openURL(url);
        } catch {
            Alert.alert('Unable to open', 'Please check that an email app or browser is available on your phone.');
        }
    };

    return (
        <SafeAreaView style={styles.screen} edges={['top', 'left', 'right', 'bottom']}>
            <Stack.Screen options={{ headerShown: false }} />

            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    activeOpacity={0.7}
                    accessibilityRole="button"
                    accessibilityLabel="Go back"
                    onPress={() => router.canGoBack() ? router.back() : router.replace('/')}
                >
                    <Ionicons name="arrow-back" size={22} color="#1F2937" />
                </TouchableOpacity>
                <View style={styles.headerText}>
                    <Text style={styles.headerTitle}>Help & FAQ</Text>
                    <Text style={styles.headerSubtitle}>A little help for campus life</Text>
                </View>
                <View style={styles.headerIcon}>
                    <Ionicons name="help-buoy-outline" size={24} color={ORANGE} />
                </View>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
                <View style={styles.intro}>
                    <View style={styles.introBadge}>
                        <Ionicons name="sparkles-outline" size={14} color={ORANGE} />
                        <Text style={styles.introBadgeText}>UNIMATE HELP CENTER</Text>
                    </View>
                    <Text style={styles.introTitle}>Hey, how can we help?</Text>
                    <Text style={styles.introDescription}>
                        From finding your next boarding to getting around campus, find your answers here.
                    </Text>
                    <Text style={styles.introHint}>9 topics • Tap a question to explore</Text>
                </View>

                <Text style={styles.sectionTitle}>Browse by topic</Text>

                {FAQ_CATEGORIES.map((category, categoryIndex) => (
                    <View key={category.title} style={styles.card}>
                        <View style={styles.categoryHeader}>
                            <View style={[styles.categoryIcon, { backgroundColor: category.tint }]}>
                                <Ionicons name={category.icon} size={21} color={category.color} />
                            </View>
                            <Text style={styles.categoryTitle}>{category.title}</Text>
                            <View style={styles.countBadge}>
                                <Text style={styles.countText}>{category.questions.length}</Text>
                            </View>
                        </View>

                        {category.questions.map((item, questionIndex) => {
                            const id = `${categoryIndex}-${questionIndex}`;
                            const isOpen = openQuestion === id;

                            return (
                                <View key={id} style={styles.questionBlock}>
                                    <TouchableOpacity
                                        style={styles.questionRow}
                                        activeOpacity={0.7}
                                        accessibilityRole="button"
                                        accessibilityState={{ expanded: isOpen }}
                                        onPress={() => setOpenQuestion(isOpen ? null : id)}
                                    >
                                        <Text style={[styles.question, isOpen && styles.activeQuestion]}>
                                            {item.question}
                                        </Text>
                                        <Ionicons
                                            name={isOpen ? 'chevron-up' : 'chevron-down'}
                                            size={18}
                                            color={isOpen ? ORANGE : '#9CA3AF'}
                                        />
                                    </TouchableOpacity>
                                    {isOpen && (
                                        <View style={styles.answerBox}>
                                            <Text style={styles.answer}>{item.answer}</Text>
                                        </View>
                                    )}
                                </View>
                            );
                        })}
                    </View>
                ))}

                <View style={styles.supportCard}>
                    <View style={styles.supportIcon}>
                        <Ionicons name="chatbubbles-outline" size={26} color={ORANGE} />
                    </View>
                    <Text style={styles.supportTitle}>Still need help?</Text>
                    <Text style={styles.supportDescription}>
                        Can't find your answer? Send us your question.
                    </Text>
                    <View style={styles.supportActions}>
                        <TouchableOpacity
                            style={[styles.contactButton, styles.emailButton]}
                            activeOpacity={0.8}
                            accessibilityRole="button"
                            onPress={() => openSupport('email')}
                        >
                            <Ionicons name="mail-outline" size={18} color="#FFFFFF" />
                            <Text style={styles.emailText}>Email us</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.contactButton, styles.whatsappButton]}
                            activeOpacity={0.8}
                            accessibilityRole="button"
                            onPress={() => openSupport('whatsapp')}
                        >
                            <Ionicons name="logo-whatsapp" size={18} color={ORANGE} />
                            <Text style={styles.whatsappText}>WhatsApp</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                <Text style={styles.footer}>Made for your campus journey 🧡</Text>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: '#FFFAF5' },
    header: {
        flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20,
        paddingVertical: 14, backgroundColor: '#FFFFFF',
        borderBottomWidth: 1, borderBottomColor: '#F3EAE1',
    },
    backButton: {
        width: 44, height: 44, borderRadius: 14, backgroundColor: '#F9FAFB',
        alignItems: 'center', justifyContent: 'center',
    },
    headerText: { flex: 1, marginHorizontal: 12 },
    headerTitle: { fontSize: 20, fontWeight: '700', color: '#111827' },
    headerSubtitle: { fontSize: 12, color: '#6B7280', marginTop: 3 },
    headerIcon: {
        width: 44, height: 44, borderRadius: 14, backgroundColor: '#FFF7ED',
        alignItems: 'center', justifyContent: 'center',
    },
    content: { padding: 20, width: '100%', maxWidth: 700, alignSelf: 'center' },
    intro: {
        backgroundColor: '#FFEDD5', borderRadius: 22, padding: 22,
        borderWidth: 1, borderColor: '#FED7AA', marginBottom: 26,
    },
    introBadge: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    introBadgeText: { fontSize: 10, fontWeight: '800', letterSpacing: 1.1, color: ORANGE },
    introTitle: { fontSize: 26, fontWeight: '800', color: '#7C2D12', marginTop: 14 },
    introDescription: { fontSize: 14, lineHeight: 22, color: '#9A3412', marginTop: 10 },
    introHint: { fontSize: 12, fontWeight: '600', color: '#9A3412', marginTop: 18 },
    sectionTitle: { fontSize: 17, fontWeight: '700', color: '#1F2937', marginBottom: 14 },
    card: {
        backgroundColor: '#FFFFFF', borderRadius: 18, borderWidth: 1,
        borderColor: '#F0E7DE', marginBottom: 16, overflow: 'hidden',
    },
    categoryHeader: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12 },
    categoryIcon: {
        width: 40, height: 40, borderRadius: 12,
        alignItems: 'center', justifyContent: 'center',
    },
    categoryTitle: { flex: 1, fontSize: 16, fontWeight: '700', color: '#1F2937' },
    countBadge: {
        minWidth: 28, minHeight: 28, paddingHorizontal: 8, borderRadius: 9,
        backgroundColor: '#FFF7ED', alignItems: 'center', justifyContent: 'center',
    },
    countText: { color: ORANGE, fontSize: 12, fontWeight: '700' },
    questionBlock: { borderTopWidth: 1, borderTopColor: '#F3F4F6' },
    questionRow: {
        flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16,
        paddingVertical: 17, minHeight: 54, gap: 12,
    },
    question: { flex: 1, fontSize: 14, fontWeight: '500', lineHeight: 21, color: '#374151' },
    activeQuestion: { color: ORANGE, fontWeight: '600' },
    answerBox: {
        marginHorizontal: 16, marginBottom: 16, padding: 14,
        backgroundColor: '#FFF7ED', borderRadius: 12,
        borderLeftWidth: 3, borderLeftColor: '#FDBA74',
    },
    answer: { fontSize: 14, lineHeight: 23, color: '#57534E' },
    supportCard: {
        backgroundColor: '#FFF1E4', borderWidth: 1, borderColor: '#FED7AA',
        borderRadius: 22, padding: 22, marginTop: 10, alignItems: 'center',
    },
    supportIcon: {
        width: 56, height: 56, borderRadius: 18, backgroundColor: '#FFFFFF',
        alignItems: 'center', justifyContent: 'center', marginBottom: 14,
    },
    supportTitle: { fontSize: 21, fontWeight: '700', color: '#7C2D12' },
    supportDescription: {
        fontSize: 14, lineHeight: 21, color: '#9A3412', textAlign: 'center', marginTop: 8,
    },
    supportActions: {
        flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 20, width: '100%',
    },
    contactButton: {
        flexGrow: 1, flexBasis: 115, flexDirection: 'row', gap: 8,
        alignItems: 'center', justifyContent: 'center', borderRadius: 12,
        paddingHorizontal: 12, paddingVertical: 14, minHeight: 48,
    },
    emailButton: { backgroundColor: ORANGE },
    whatsappButton: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#FDBA74' },
    emailText: { fontSize: 14, fontWeight: '700', color: '#FFFFFF' },
    whatsappText: { fontSize: 14, fontWeight: '700', color: ORANGE },
    footer: { fontSize: 12, color: '#9CA3AF', textAlign: 'center', marginTop: 24, marginBottom: 8 },
});
