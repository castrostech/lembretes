import { storage } from "./storage";
import { sendEmail, generateTrainingExpiryEmail } from "./emailService";

export function setupCronJobs() {
  // Run every day at 9 AM
  const checkInterval = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
  
  console.log("Setting up training expiry cron jobs...");
  
  // Initial run after 1 minute
  setTimeout(checkTrainingExpiry, 60 * 1000);
  
  // Then run daily
  setInterval(checkTrainingExpiry, checkInterval);
}

async function checkTrainingExpiry() {
  console.log("Checking training expiry...");
  
  try {
    // Check for trainings expiring in 5 days
    const expiring5Days = await storage.getExpiringTrainings(5);
    
    // Check for trainings expiring today
    const expiringToday = await storage.getExpiringTrainings(0);
    
    // Process 5-day warnings
    for (const training of expiring5Days) {
      await processTrainingAlert(training, '5_days_warning', 5);
    }
    
    // Process expiry day alerts
    for (const training of expiringToday) {
      await processTrainingAlert(training, 'expiry_day', 0);
    }
    
    console.log(`Processed ${expiring5Days.length} 5-day warnings and ${expiringToday.length} expiry alerts`);
  } catch (error) {
    console.error("Error checking training expiry:", error);
  }
}

async function processTrainingAlert(training: any, alertType: string, daysUntilExpiry: number) {
  try {
    // Check if alert already exists and was sent
    const existingAlerts = await storage.getUnsentAlerts();
    const existingAlert = existingAlerts.find(
      alert => alert.trainingId === training.id && alert.type === alertType
    );
    
    if (existingAlert) {
      return; // Alert already exists
    }
    
    // Create new alert
    const alert = await storage.createAlert({
      userId: training.userId,
      trainingId: training.id,
      type: alertType,
    });
    
    // Get user and employee information
    const user = await storage.getUser(training.userId);
    const employee = await storage.getEmployee(training.employeeId, training.userId);
    
    if (!user || !user.email || !employee) {
      console.error(`Missing user or employee data for training ${training.id}`);
      return;
    }
    
    // Generate email content
    const emailContent = generateTrainingExpiryEmail(
      employee.name,
      training.title,
      training.expiryDate,
      daysUntilExpiry
    );
    
    // Send email
    const emailSent = await sendEmail({
      to: user.email,
      from: 'alerts@trainmanager.com',
      subject: emailContent.subject,
      html: emailContent.html,
      text: emailContent.text,
    });
    
    if (emailSent) {
      await storage.markAlertAsSent(alert.id);
      console.log(`Alert sent for training ${training.title} to ${user.email}`);
    } else {
      console.error(`Failed to send alert for training ${training.title}`);
    }
  } catch (error) {
    console.error(`Error processing alert for training ${training.id}:`, error);
  }
}
