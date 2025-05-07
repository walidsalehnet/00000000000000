// تهيئة Firebase
const firebaseConfig = {
  apiKey: "AIzaSyAdf5AKFgLXgK2PYERHw1hgF_HsMmuTfuo",
  authDomain: "noproblem-55b97.firebaseapp.com",
  projectId: "noproblem-55b97",
  storageBucket: "noproblem-55b97.appspot.com",
  messagingSenderId: "316010224446",
  appId: "1:316010224446:web:5d7e7f792e53ee4b396a6f",
  measurementId: "G-VKSGWBRKVL"
};
firebase.initializeApp(firebaseConfig);

let otpCode = null;
let lastOtpTime = 0;

// ✅ إرسال OTP
async function sendOtp(phoneNumber, name) {
  const now = Date.now();
  if (now - lastOtpTime < 2 * 60 * 1000) {
    Swal.fire("انتظر", "يرجى الانتظار دقيقتين قبل إعادة إرسال الكود", "info");
    return;
  }

  const formData = new FormData();
  formData.append("phoneNumber", phoneNumber);
  formData.append("name", name);
  formData.append("type", "sms");
  formData.append("otp_length", "4");
  formData.append("lang", "ar");

  try {
    const response = await fetch("https://beon.chat/api/send/message/otp", {
      method: "POST",
      headers: {
        "beon-token": "EmEC4Pf2m7R6hgGIYOwW"
      },
      body: formData
    });

    const result = await response.json();
    if (result.status === 200) {
      otpCode = result.data;
      lastOtpTime = now;

      document.getElementById("otpSection").style.display = "block";
      Swal.fire("تم الإرسال", `تم إرسال الكود بنجاح`, "success");

      // حفظ الكود في Firestore مؤقتًا (اختياري)
      await firebase.firestore().collection("otp_temp").add({
        phoneNumber,
        code: otpCode,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
      });
    } else {
      Swal.fire("خطأ", result.message || "فشل إرسال الكود", "error");
    }
  } catch (error) {
    Swal.fire("خطأ", "حدث خطأ أثناء إرسال الكود", "error");
    console.error(error);
  }
}
// دالة للتحقق من صحة رقم الهاتف
function validatePhoneNumber(phoneNumber) {
    const phonePattern = /^\+?[1-9]\d{1,14}$/; // نمط للتحقق من تنسيق الرقم
    return phonePattern.test(phoneNumber);
}

function sendOtp() {
    const phoneNumber = document.getElementById('phoneNumber').value;

    if (!validatePhoneNumber(phoneNumber)) {
        alert('❌ رقم الهاتف غير صحيح. تأكد من إضافة رمز الدولة.');
        return;
    }

    // باقي الكود لإرسال OTP بعد التحقق من الرقم
    const appVerifier = new firebase.auth.RecaptchaVerifier('recaptcha-container', {
        size: 'invisible'
    });

    firebase.auth().signInWithPhoneNumber(phoneNumber, appVerifier)
        .then((confirmationResult) => {
            window.confirmationResult = confirmationResult;
            alert('✅ تم إرسال الكود إلى رقم الهاتف');
            document.getElementById('otpSection').style.display = 'block'; // إظهار حقل OTP
        })
        .catch((error) => {
            alert('❌ فشل في إرسال الكود: ' + error.message);
        });
}

// ✅ إنشاء حساب
// دالة للتحقق من المدخلات
function validateInputs() {
  const username = document.getElementById("username").value;
  const phoneNumber = document.getElementById("phoneNumber").value;
  const password = document.getElementById("password").value;
  const confirmPassword = document.getElementById("confirmPassword").value;

  if (!username || !phoneNumber || !password || !confirmPassword) {
      Swal.fire('خطأ', 'يرجى ملء جميع الحقول', 'error');
      return false;
  }

  if (password !== confirmPassword) {
      Swal.fire('خطأ', 'كلمة المرور وتأكيد كلمة المرور غير متطابقتين', 'error');
      return false;
  }

  return true;
}

// دالة لإرسال OTP عبر Firebase
function sendOtp(phoneNumber) {
  // تحقق من وجود حاوية recaptcha-container في الصفحة
  const recaptchaContainer = document.getElementById('recaptcha-container');
  if (!recaptchaContainer) {
      console.error("❌ حاوية reCAPTCHA غير موجودة في الصفحة");
      return;
  }

  // تنظيف الحاوية في حال كانت تحتوي على عناصر من محاولات سابقة
  recaptchaContainer.innerHTML = ''; 

  const recaptchaVerifier = new firebase.auth.RecaptchaVerifier('recaptcha-container', {
      size: 'invisible', // أو 'normal' لعرض reCAPTCHA للمستخدم
  });

  firebase.auth().signInWithPhoneNumber(phoneNumber, recaptchaVerifier)
      .then((confirmationResult) => {
          window.confirmationResult = confirmationResult;
          document.getElementById("otpSection").style.display = "block"; // إظهار قسم OTP
      })
      .catch((error) => {
          Swal.fire('خطأ', 'فشل في إرسال OTP', 'error');
          console.error(error);
      });
}


// دالة للتحقق من OTP
function verifyOtp() {
  const otp = document.getElementById("otp").value;
  confirmationResult.confirm(otp).then((result) => {
      const user = result.user;
      // متابعة الإجراءات بعد التحقق الناجح من OTP
      Swal.fire('نجاح', 'تم التحقق من الرقم بنجاح!', 'success');
      createUserAccount(user);
  }).catch((error) => {
      Swal.fire('خطأ', 'التحقق من الكود فشل', 'error');
      console.error(error);
  });
}

// دالة لإنشاء الحساب بعد التحقق من OTP
function createUserAccount(user) {
  const username = document.getElementById("username").value;
  const phoneNumber = document.getElementById("phoneNumber").value;

  // إضافة بيانات المستخدم إلى Firestore
  firebase.firestore().collection("users").doc(user.uid).set({
      username: username,
      phoneNumber: phoneNumber,
      wallet: 0, // قيمة مبدئية للرصيد
  })
  .then(() => {
      Swal.fire('نجاح', 'تم إنشاء الحساب بنجاح!', 'success');
      window.location.href = "login.html";
  })
  .catch((error) => {
      Swal.fire('خطأ', 'فشل في إنشاء الحساب', 'error');
      console.error(error);
  });
}

// دالة لتسجيل الحساب
function signUp() {
  if (validateInputs()) {
      const phoneNumber = document.getElementById("phoneNumber").value;
      sendOtp(phoneNumber);
  }
}


// ✅ تسجيل الدخول
function login() {
  const phoneNumber = document.getElementById('phoneNumber').value;
  const password = document.getElementById('password').value;

  if (!phoneNumber || !password) {
    Swal.fire('الرجاء إدخال جميع الحقول');
    return;
  }

  // التحقق من رقم الهاتف باستخدام Firebase
  firebase.auth().signInWithEmailAndPassword(phoneNumber + "@gmail.com", password)
    .then((userCredential) => {
      const user = userCredential.user;

      // إذا تم تسجيل الدخول بنجاح
      Swal.fire({
        icon: 'success',
        title: 'تم تسجيل الدخول',
        text: 'مرحبًا بك في حسابك!',
      });

      // التوجيه إلى صفحة البروفايل بعد النجاح
      window.location.href = "profile.html"; 
    })
    .catch((error) => {
      // إذا كان هناك خطأ في تسجيل الدخول
      const errorMessage = error.message;
      Swal.fire({
        icon: 'error',
        title: 'خطأ',
        text: errorMessage,
      });
    });
}
function verifyOtp() {
  const otp = document.getElementById('otp').value;
  // الكود الخاص بالتحقق من OTP
}


// ✅ إرسال OTP لاسترجاع كلمة المرور
async function sendOtpForReset() {
  const phone = document.getElementById("phoneNumber").value;
  await sendOtp(phone, "مستخدم");
}

// ✅ التحقق وتحديث كلمة المرور
async function verifyOtpForReset() {
  const phone = document.getElementById("phoneNumber").value;
  const enteredOtp = document.getElementById("otp").value;

  if (enteredOtp === otpCode) {
    const newPassword = prompt("أدخل كلمة المرور الجديدة:");
    if (newPassword) {
      const users = await firebase.firestore().collection("users")
        .where("phoneNumber", "==", phone).get();
      users.forEach(doc => doc.ref.update({ password: newPassword }));
      Swal.fire("تم", "تم تغيير كلمة المرور بنجاح", "success");
    }
  } else {
    Swal.fire("خطأ", "كود التحقق غير صحيح", "error");
  }
}
