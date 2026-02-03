import { PrismaClient, UserRole, MessageType } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  await prisma.refreshToken.deleteMany();
  await prisma.summary.deleteMany();
  await prisma.message.deleteMany();
  await prisma.conversation.deleteMany();
  await prisma.user.deleteMany();

  const hashedPassword = await bcrypt.hash('password123', 10);

  const doctor = await prisma.user.create({
    data: {
      email: 'doctor@medical.com',
      password: hashedPassword,
      name: 'Dr. Sarah Johnson',
      role: UserRole.DOCTOR,
      language: 'en',
    },
  });

  const patient = await prisma.user.create({
    data: {
      email: 'patient@medical.com',
      password: hashedPassword,
      name: 'Carlos Rodriguez',
      role: UserRole.PATIENT,
      language: 'es',
    },
  });

  console.log('✅ Created demo users');

  const conversation = await prisma.conversation.create({
    data: {
      doctorId: doctor.id,
      patientId: patient.id,
      doctorLanguage: 'en',
      patientLanguage: 'es',
      status: 'ACTIVE',
    },
  });

  // Multilingual doctor–patient consultation (English ↔ Spanish) for a meaningful AI summary
  const messages = [
    {
      conversationId: conversation.id,
      senderId: doctor.id,
      senderRole: UserRole.DOCTOR,
      content: 'Good morning. What brings you in today?',
      translatedContent: 'Buenos días. ¿Qué le trae por aquí hoy?',
      type: MessageType.TEXT,
    },
    {
      conversationId: conversation.id,
      senderId: patient.id,
      senderRole: UserRole.PATIENT,
      content: 'Buenos días doctora. Tengo dolor de cabeza muy fuerte desde hace tres días y fiebre desde ayer.',
      translatedContent: 'Good morning doctor. I have had a very strong headache for three days and fever since yesterday.',
      type: MessageType.TEXT,
    },
    {
      conversationId: conversation.id,
      senderId: doctor.id,
      senderRole: UserRole.DOCTOR,
      content: 'I see. Is the headache constant or does it come and go? Do you have any nausea, vomiting, or sensitivity to light?',
      translatedContent: 'Entiendo. ¿El dolor de cabeza es constante o va y viene? ¿Tiene náuseas, vómitos o sensibilidad a la luz?',
      type: MessageType.TEXT,
    },
    {
      conversationId: conversation.id,
      senderId: patient.id,
      senderRole: UserRole.PATIENT,
      content: 'Es constante, sobre todo en la frente. Sí tengo náuseas y la luz me molesta mucho. No he vomitado.',
      translatedContent: 'It is constant, especially in my forehead. I do have nausea and light bothers me a lot. I have not vomited.',
      type: MessageType.TEXT,
    },
    {
      conversationId: conversation.id,
      senderId: doctor.id,
      senderRole: UserRole.DOCTOR,
      content: 'Have you taken any medication for the pain or fever? Any other health conditions or regular medications?',
      translatedContent: '¿Ha tomado algún medicamento para el dolor o la fiebre? ¿Otras enfermedades o medicamentos habituales?',
      type: MessageType.TEXT,
    },
    {
      conversationId: conversation.id,
      senderId: patient.id,
      senderRole: UserRole.PATIENT,
      content: 'Tomé paracetamol ayer dos veces pero no mejoró mucho. No tengo otras enfermedades. No tomo medicación fija.',
      translatedContent: 'I took paracetamol yesterday twice but it did not improve much. I have no other conditions. I do not take regular medication.',
      type: MessageType.TEXT,
    },
    {
      conversationId: conversation.id,
      senderId: doctor.id,
      senderRole: UserRole.DOCTOR,
      content: 'Based on your symptoms—persistent headache for three days, fever, nausea, and photophobia—this could be a migraine or a sinus infection. I will prescribe ibuprofen 400mg for the pain and fever. Please rest in a dark, quiet room and stay well hydrated.',
      translatedContent: 'Según sus síntomas—dolor de cabeza persistente de tres días, fiebre, náuseas y fotofobia—podría ser una migraña o una sinusitis. Le recetaré ibuprofeno 400 mg para el dolor y la fiebre. Descanse en una habitación oscura y tranquila y manténgase bien hidratado.',
      type: MessageType.TEXT,
    },
    {
      conversationId: conversation.id,
      senderId: patient.id,
      senderRole: UserRole.PATIENT,
      content: '¿Cuándo debo volver si no mejoro? ¿Hay algo que deba evitar?',
      translatedContent: 'When should I come back if I do not improve? Is there anything I should avoid?',
      type: MessageType.TEXT,
    },
    {
      conversationId: conversation.id,
      senderId: doctor.id,
      senderRole: UserRole.DOCTOR,
      content: 'If the fever goes above 38.5°C, the headache becomes much worse, or you develop neck stiffness or confusion, go to the emergency room. Otherwise, avoid alcohol and get plenty of rest. I would like to see you again in one week if symptoms persist. Here is your prescription for ibuprofen.',
      translatedContent: 'Si la fiebre supera los 38,5°C, el dolor de cabeza empeora mucho o tiene rigidez de cuello o confusión, vaya a urgencias. En caso contrario, evite el alcohol y descanse. Me gustaría verle de nuevo en una semana si los síntomas continúan. Aquí tiene la receta de ibuprofeno.',
      type: MessageType.TEXT,
    },
    {
      conversationId: conversation.id,
      senderId: patient.id,
      senderRole: UserRole.PATIENT,
      content: 'Gracias doctora, lo haré.',
      translatedContent: 'Thank you doctor, I will.',
      type: MessageType.TEXT,
    },
  ];

  await prisma.message.createMany({ data: messages });
  console.log('✅ Created multilingual doctor–patient conversation');

  await prisma.summary.create({
    data: {
      conversationId: conversation.id,
      content: 'Patient presented with a three-day history of severe frontal headache and one day of fever. Associated symptoms included nausea and photophobia without vomiting. Paracetamol had been tried with limited effect. No other medical conditions or regular medications. Assessment suggested migraine or sinus infection. Ibuprofen 400mg was prescribed for pain and fever, with advice to rest in a dark, quiet environment and maintain hydration. Patient was advised to seek emergency care if fever exceeds 38.5°C, headache worsens significantly, or if neck stiffness or confusion develop; otherwise to avoid alcohol and return in one week if symptoms persist.',
      symptoms: ['Headache', 'Fever', 'Nausea', 'Photophobia'],
      diagnoses: ['Migraine (suspected)', 'Sinus infection (differential)'],
      medications: ['Paracetamol (previously tried)', 'Ibuprofen 400mg (prescribed)'],
      followUpActions: [
        'Rest in dark, quiet environment',
        'Maintain hydration',
        'Avoid alcohol',
        'Return in one week if symptoms persist',
        'Seek emergency care if fever >38.5°C, worsening headache, neck stiffness, or confusion',
      ],
    },
  });

  console.log('✅ Created demo summary (AI Summary will regenerate from conversation when clicked)');
  console.log('🎉 Database seed completed successfully!');
  console.log('\n📧 Demo Credentials:');
  console.log('  Doctor:  doctor@medical.com  / password123');
  console.log('  Patient: patient@medical.com / password123');
  console.log('\n💡 For assignment: Log in, open the conversation, and click "AI Summary" to test.');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
