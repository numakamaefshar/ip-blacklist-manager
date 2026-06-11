# IP Blacklist Manager

כלי אוטומטי לניטור לוגים, זיהוי כתובות IP חשודות וחסימתן בזמן אמת באמצעות iptables.

הכלי פותח כחלק מתרגול SOC — אוטומציה של תהליך זיהוי איומים ותגובה (Detection & Response).

---

## על איזה מערכת הכלי עובד?

הכלי עובד על **כל לינוקס** — Kali Linux, Ubuntu, Debian וכו'.

אין הבדל בין Kali ל-Ubuntu לצורך הרצת הכלי הזה.

---

## איך זה עובד — צעד אחר צעד

```
1. הכלי פותח את קובץ הלוג של Apache
         ↓
2. קורא כל שורה ומחלץ את כתובת ה-IP
         ↓
3. סופר כמה פעמים כל IP הופיע
         ↓
4. כל IP שעבר את הסף (ברירת מחדל: 100 בקשות)
   עם קודי שגיאה חשודים (403, 404, 429 וכו')
         ↓
5. שומר אותו ב-blacklist.json
         ↓
6. מריץ: iptables -A INPUT -s <IP> -j DROP
         ↓
7. ה-IP חסום ברמת מערכת ההפעלה
```

---

## התקנה

```bash
# התקן Node.js אם אין
sudo apt install nodejs

# התקן Apache אם אין (כדי שיהיו לוגים)
sudo apt install apache2
sudo service apache2 start

# חלץ את הפרויקט
unzip ip-blacklist.zip
cd ip-blacklist
```

---

## איפה צריך לשנות בקוד

**קובץ אחד בלבד:** `config/config.js`

פתח אותו וערוך לפי הצורך:

```js
// 1. נתיב קובץ הלוג שלך
logFile: '/var/log/apache2/access.log',

// 2. פורמט הלוג (apache / nginx / json / custom)
logFormat: 'apache',

// 3. כמה בקשות מ-IP אחד נחשב חשוד
requestThreshold: 100,

// 4. אילו קודי HTTP נחשבים חשודים
suspiciousStatusCodes: [400, 401, 403, 404, 429],

// 5. להדפיס בלבד ללא חסימה אמיתית (true = בדיקה בלבד)
dryRun: false,
```

---

## הרצה

```bash
# בדיקה ראשונה — ללא חסימה בפועל
# שנה dryRun: true ב-config.js, ואז:
node index.js

# הרצה אמיתית עם חסימה
sudo node index.js
```

פלט לדוגמה:
```
[2024-01-15T10:23:11.000Z] INFO  === IP Blacklist Manager Started ===
[2024-01-15T10:23:11.042Z] INFO  Parsing log file: /var/log/apache2/access.log
[2024-01-15T10:23:11.318Z] INFO    192.168.1.105 → 347 hits
[2024-01-15T10:23:11.319Z] INFO    10.0.0.88 → 212 hits
[2024-01-15T10:23:11.320Z] INFO  Found 2 suspicious IP(s)
[2024-01-15T10:23:11.450Z] INFO  Blocked IP: 192.168.1.105 (iptables DROP added)
[2024-01-15T10:23:11.451Z] INFO  Blocked IP: 10.0.0.88 (iptables DROP added)
[2024-01-15T10:23:11.452Z] INFO  === Done ===
```

---

## CLI — ניהול ידני

```bash
node cli.js list                 # הצגת כל ה-IPs החסומים
sudo node cli.js add 1.2.3.4     # חסימה ידנית של IP
sudo node cli.js remove 1.2.3.4  # שחרור IP מהחסימה
sudo node cli.js sync            # סנכרון הרשימה ל-iptables אחרי reboot
```

---

## הרצה אוטומטית — cron

```bash
crontab -e
# סריקה כל שעה:
0 * * * * cd /path/to/ip-blacklist && sudo node index.js >> /var/log/ip-blacklist.log 2>&1
```

---

## הערות

- נדרשות הרשאות root להפעלת iptables
- חוקי iptables נמחקים בהפעלה מחדש — הרץ `sudo node cli.js sync` אחרי כל אתחול
- השתמש ב-`dryRun: true` לפני כל הרצה בסביבה חדשה
