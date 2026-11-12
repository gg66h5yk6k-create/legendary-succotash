import { login, signup, logout, getUser, getSettings, handleAuthCallback, requestPasswordRecovery, updateUser, acceptInvite, onAuthChange } from '@netlify/identity';

const keys = ['login','signup','logout','password','forgot','sendReset','newPassword','setPassword','confirmEmail','resetSent','authError','loading','saving','saved','saveError','retry','signInFirst','privacy','helpText','conflict','reload','accountTitle','accountIntro','wait','loadError','loadRetry','loginExpired','signupClosed','working','passwordUpdated'];
const words = {
 de:['Anmelden','Konto erstellen','Abmelden','Passwort','Passwort vergessen?','Link zum Zurücksetzen senden','Neues Passwort','Passwort speichern','Bitte bestätige dein Konto über den Link in deiner E-Mail. Melde dich danach an.','Wenn ein Konto mit dieser Adresse existiert, erhältst du eine E-Mail zum Zurücksetzen.','Anmeldung nicht möglich. Prüfe deine Angaben und ob deine E-Mail bestätigt ist.','Lebenslauf wird geladen …','Wird gespeichert …','Alle Änderungen gespeichert','Speichern fehlgeschlagen. Deine Änderungen sind noch nicht gesichert.','Erneut speichern','Zum Speichern bitte anmelden','Dein Lebenslauf wird automatisch in deinem persönlichen Konto gespeichert.','Fülle die fünf Schritte aus. Dein Lebenslauf wird nach jeder Änderung automatisch in deinem Konto gespeichert. Warte vor dem Schließen auf „Alle Änderungen gespeichert“. Unter „Vorschau“ kannst du ihn als PDF drucken. Nach der Anmeldung findest du deinen gespeicherten Stand wieder.','Der Lebenslauf wurde in einer anderen Sitzung geändert. Lade den gespeicherten Stand; dabei werden deine ungespeicherten Änderungen verworfen.','Gespeicherten Stand laden – lokale Änderungen verwerfen','Dein Lebenslauf. Sicher in deinem Konto.','Melde dich an oder erstelle ein Konto, um deinen Lebenslauf zu speichern und später weiterzubearbeiten.','Bitte warten …','Dein Lebenslauf konnte nicht geladen werden. Die gespeicherten Daten wurden nicht verändert.','Laden wiederholen','Deine Sitzung ist abgelaufen. Melde dich erneut mit demselben Konto an, um die Änderungen zu speichern.','Neue Registrierungen sind derzeit geschlossen.','Wird bearbeitet …','Passwort aktualisiert.'],
 en:['Sign in','Create account','Sign out','Password','Forgot password?','Send reset link','New password','Save password','Confirm your account using the link in your email, then sign in.','If an account exists for this address, you will receive a reset email.','Unable to sign in. Check your details and confirm your email.','Loading résumé …','Saving …','All changes saved','Saving failed. Your changes have not been saved yet.','Retry saving','Sign in to save','Your résumé is saved automatically in your personal account.','Complete the five steps. Changes are saved automatically to your account. Wait for “All changes saved” before closing. Use Preview to print as PDF. Sign in again to continue from your saved résumé.','This résumé changed in another session. Load the saved version; this discards your unsaved changes.','Load saved version – discard local changes','Your résumé. Safe in your account.','Sign in or create an account to save your résumé and continue later.','Please wait …','Your résumé could not be loaded. Saved data has not been changed.','Retry loading','Your session expired. Sign in again with the same account to save your changes.','New registrations are currently closed.','Working …','Password updated.'],
 fr:['Se connecter','Créer un compte','Se déconnecter','Mot de passe','Mot de passe oublié ?','Envoyer le lien','Nouveau mot de passe','Enregistrer le mot de passe','Confirmez votre compte avec le lien reçu par e-mail, puis connectez-vous.','Si ce compte existe, vous recevrez un e-mail de réinitialisation.','Connexion impossible. Vérifiez vos informations et votre e-mail.','Chargement du CV …','Enregistrement …','Toutes les modifications sont enregistrées','Échec de l’enregistrement. Les modifications ne sont pas sauvegardées.','Réessayer','Connectez-vous pour enregistrer','Votre CV est enregistré automatiquement dans votre compte personnel.','Complétez les cinq étapes. Les modifications sont enregistrées automatiquement dans votre compte. Attendez la confirmation avant de fermer. Utilisez l’aperçu pour imprimer en PDF. Reconnectez-vous pour retrouver votre CV.','Le CV a été modifié dans une autre session. Charger la version enregistrée supprime vos modifications non enregistrées.','Charger la version enregistrée – supprimer les modifications locales','Votre CV, dans votre compte.','Connectez-vous ou créez un compte pour enregistrer votre CV et le reprendre plus tard.','Veuillez patienter …','Impossible de charger le CV. Les données enregistrées sont inchangées.','Recharger','Session expirée. Reconnectez-vous avec le même compte pour enregistrer.','Les inscriptions sont actuellement fermées.','Traitement …','Mot de passe mis à jour.'],
 tr:['Giriş yap','Hesap oluştur','Çıkış yap','Şifre','Şifremi unuttum','Sıfırlama bağlantısı gönder','Yeni şifre','Şifreyi kaydet','E-postadaki bağlantıyla hesabınızı doğrulayıp giriş yapın.','Bu adres için hesap varsa sıfırlama e-postası alacaksınız.','Giriş yapılamadı. Bilgilerinizi ve e-posta doğrulamasını kontrol edin.','Özgeçmiş yükleniyor …','Kaydediliyor …','Tüm değişiklikler kaydedildi','Kayıt başarısız. Değişiklikleriniz henüz kaydedilmedi.','Yeniden kaydet','Kaydetmek için giriş yapın','Özgeçmişiniz kişisel hesabınıza otomatik kaydedilir.','Beş adımı doldurun. Değişiklikler hesabınıza otomatik kaydedilir. Kapatmadan önce kayıt onayını bekleyin. Önizlemeden PDF yazdırabilirsiniz. Tekrar giriş yaparak devam edebilirsiniz.','Özgeçmiş başka oturumda değiştirildi. Kayıtlı sürümü yüklemek kaydedilmemiş değişiklikleri siler.','Kayıtlı sürümü yükle – yerel değişiklikleri sil','Özgeçmişiniz hesabınızda güvende.','Kaydetmek ve daha sonra devam etmek için giriş yapın veya hesap oluşturun.','Lütfen bekleyin …','Özgeçmiş yüklenemedi. Kayıtlı veriler değiştirilmedi.','Yüklemeyi yeniden dene','Oturumunuz sona erdi. Kaydetmek için aynı hesapla tekrar giriş yapın.','Yeni kayıtlar şu anda kapalı.','İşleniyor …','Şifre güncellendi.'],
 ru:['Войти','Создать аккаунт','Выйти','Пароль','Забыли пароль?','Отправить ссылку','Новый пароль','Сохранить пароль','Подтвердите аккаунт по ссылке в письме, затем войдите.','Если аккаунт существует, вы получите письмо для сброса пароля.','Не удалось войти. Проверьте данные и подтверждение почты.','Загрузка резюме …','Сохранение …','Все изменения сохранены','Не удалось сохранить. Изменения ещё не сохранены.','Повторить сохранение','Войдите для сохранения','Резюме автоматически сохраняется в вашем аккаунте.','Заполните пять шагов. Изменения сохраняются автоматически. Перед закрытием дождитесь подтверждения. В предпросмотре можно сохранить PDF. Войдите снова, чтобы продолжить.','Резюме изменено в другом сеансе. Загрузка сохранённой версии удалит ваши несохранённые изменения.','Загрузить сохранённую версию — удалить местные изменения','Ваше резюме в вашем аккаунте.','Войдите или создайте аккаунт, чтобы сохранить резюме и продолжить позже.','Подождите …','Не удалось загрузить резюме. Сохранённые данные не изменены.','Повторить загрузку','Сеанс истёк. Войдите в тот же аккаунт, чтобы сохранить изменения.','Регистрация сейчас закрыта.','Обработка …','Пароль обновлён.'],
 ar:['تسجيل الدخول','إنشاء حساب','تسجيل الخروج','كلمة المرور','نسيت كلمة المرور؟','إرسال رابط الاستعادة','كلمة مرور جديدة','حفظ كلمة المرور','أكد حسابك عبر الرابط في بريدك الإلكتروني ثم سجل الدخول.','إذا كان الحساب موجودًا فستصلك رسالة لاستعادة كلمة المرور.','تعذر تسجيل الدخول. تحقق من بياناتك وتأكيد بريدك الإلكتروني.','جارٍ تحميل السيرة الذاتية …','جارٍ الحفظ …','تم حفظ جميع التغييرات','فشل الحفظ. لم يتم حفظ التغييرات بعد.','إعادة الحفظ','سجل الدخول للحفظ','يتم حفظ سيرتك الذاتية تلقائيًا في حسابك الشخصي.','أكمل الخطوات الخمس. تُحفظ التغييرات تلقائيًا في حسابك. انتظر تأكيد الحفظ قبل الإغلاق. يمكنك الطباعة بصيغة PDF من المعاينة. سجل الدخول مجددًا لمتابعة سيرتك المحفوظة.','تم تعديل السيرة في جلسة أخرى. تحميل النسخة المحفوظة يحذف تغييراتك غير المحفوظة.','تحميل النسخة المحفوظة وحذف التغييرات المحلية','سيرتك الذاتية بأمان في حسابك.','سجل الدخول أو أنشئ حسابًا لحفظ سيرتك الذاتية والمتابعة لاحقًا.','يرجى الانتظار …','تعذر تحميل السيرة الذاتية. لم تتغير البيانات المحفوظة.','إعادة التحميل','انتهت جلستك. سجل الدخول بنفس الحساب لحفظ التغييرات.','التسجيل الجديد مغلق حاليًا.','جارٍ المعالجة …','تم تحديث كلمة المرور.'],
 hi:['लॉगिन करें','खाता बनाएँ','लॉगआउट','पासवर्ड','पासवर्ड भूल गए?','रीसेट लिंक भेजें','नया पासवर्ड','पासवर्ड सहेजें','ईमेल के लिंक से खाता सत्यापित करके लॉगिन करें।','इस पते का खाता मौजूद होने पर रीसेट ईमेल मिलेगा।','लॉगिन नहीं हुआ। जानकारी और ईमेल सत्यापन जाँचें।','बायोडाटा लोड हो रहा है …','सहेजा जा रहा है …','सभी बदलाव सहेज लिए गए','सहेजना विफल हुआ। बदलाव अभी सुरक्षित नहीं हैं।','फिर सहेजें','सहेजने के लिए लॉगिन करें','बायोडाटा आपके व्यक्तिगत खाते में अपने आप सहेजा जाता है।','पाँच चरण भरें। बदलाव खाते में अपने आप सहेजे जाते हैं। बंद करने से पहले पुष्टि की प्रतीक्षा करें। पूर्वावलोकन से PDF प्रिंट करें। दोबारा लॉगिन करके आगे जारी रखें।','बायोडाटा दूसरे सत्र में बदला गया। सहेजा संस्करण लोड करने से आपके असहेजे बदलाव मिटेंगे।','सहेजा संस्करण लोड करें — स्थानीय बदलाव मिटाएँ','आपका बायोडाटा आपके खाते में सुरक्षित।','सहेजने और बाद में जारी रखने के लिए लॉगिन करें या खाता बनाएँ।','कृपया प्रतीक्षा करें …','बायोडाटा लोड नहीं हुआ। सहेजे डेटा में बदलाव नहीं हुआ।','फिर लोड करें','सत्र समाप्त हुआ। बदलाव सहेजने के लिए उसी खाते से दोबारा लॉगिन करें।','नए पंजीकरण अभी बंद हैं।','प्रक्रिया जारी है …','पासवर्ड अपडेट हो गया।']
};
export function installAccountTranslations(translations) {
  for (const [language, list] of Object.entries(words)) {
    const d = translations[language];
    keys.forEach((key, i) => d[key] = list[i]);
    d.session = d.signInFirst;
    d.accountEmail = ({ de: 'E-Mail-Adresse', en: 'Email address', fr: 'Adresse e-mail', tr: 'E-posta adresi', ru: 'Электронная почта', ar: 'البريد الإلكتروني', hi: 'ईमेल पता' })[language];
  }
}

export function initAccount({ $, t, getDocument, applyDocument }) {
  let user = null, loaded = false, dirty = false, revision = 0, version = 0, generation = 0;
  let timer, pending, state = 'signInFirst', authMode = 'login', authBusy = false, inviteToken, signupAllowed = true;
  const editorMain = document.querySelector('main');
  function message(key, error = false) { $('#auth-message').textContent = t()[key] || ''; $('#auth-message').classList.toggle('error', error); }
  function refreshUI() {
    $('#save-state').textContent = t()[state];
    $('#save-banner').dataset.state = state;
    $('#account-email').textContent = user?.email || '';
    $('#logout').hidden = !user;
    $('#open-login').hidden = !!user && state !== 'loginExpired';
    $('#retry-save').hidden = !['saveError'].includes(state);
    $('#retry-load').hidden = state !== 'loadError';
    $('#reload-saved').hidden = state !== 'conflict';
    editorMain.hidden = !loaded || (['recovery', 'invite'].includes(authMode));
    $('#account-panel').hidden = loaded && !['recovery', 'invite', 'reauth'].includes(authMode);
    $('#auth-tabs').hidden = ['recovery', 'invite'].includes(authMode);
    $('#auth-name-field').hidden = authMode !== 'signup';
    $('#forgot-password').hidden = !['login', 'signup', 'reauth'].includes(authMode);
    document.querySelector('label[for=auth-password]').textContent = t()[['recovery', 'invite'].includes(authMode) ? 'newPassword' : 'password'];
    $('#auth-password-field').hidden = authMode === 'reset';
    $('#auth-password').required = authMode !== 'reset';
    $('#auth-password').minLength = authMode === 'login' || authMode === 'reauth' ? 1 : 8;
    $('#auth-password').autocomplete = ['login', 'reauth'].includes(authMode) ? 'current-password' : 'new-password';
    $('#auth-email-field').hidden = ['recovery', 'invite'].includes(authMode);
    $('#auth-email').required = !['recovery', 'invite'].includes(authMode);
    $('#auth-submit').textContent = t()[authBusy ? 'working' : ({ reset: 'sendReset', recovery: 'setPassword', invite: 'setPassword', reauth: 'login' })[authMode] || authMode];
    $('#auth-submit').disabled = authBusy || (authMode === 'signup' && !signupAllowed);
    $('#signup-tab').hidden = !signupAllowed;
    for (const mode of ['login', 'signup']) $('#'+mode+'-tab').setAttribute('aria-pressed', String(authMode === mode));
    $('#editor').inert = !loaded;
  }
  function setState(key) { state = key; refreshUI(); }
  async function api(method, body) {
    const response = await fetch('/api/resume', { method, credentials: 'same-origin', cache: 'no-store', headers: { 'X-Account-ID': user?.id || '', ...(body ? { 'Content-Type': 'application/json' } : {}) }, body: body ? JSON.stringify(body) : undefined });
    if (!response.ok) throw Object.assign(new Error('Request failed'), { status: response.status });
    return response.json();
  }
  function clear() {
    generation++; clearTimeout(timer); user = null; loaded = false; dirty = false; version = 0; revision = 0;
    applyDocument(null); authMode = 'login'; setState('signInFirst');
    $('#auth-password').value = ''; $('#auth-name').value = ''; $('#auth-email').value = ''; message('');
    if ($('#modal').open) $('#modal').close();
  }
  async function load() {
    if (!user) return;
    const run = generation;
    loaded = false; setState('loading');
    try {
      const result = await api('GET');
      if (run !== generation) return;
      version = result.version;
      dirty = false; revision = 0;
      applyDocument(result.document);
      loaded = true; setState('saved');
    } catch (error) { if (run === generation) { setState(error.status === 401 ? 'loginExpired' : 'loadError'); message(error.status === 401 ? 'loginExpired' : 'loadError', true); } }
  }
  async function activate(nextUser) {
    if (!nextUser) { clear(); return; }
    if (user?.id === nextUser.id && loaded) {
      user = nextUser; authMode = 'login'; refreshUI();
      if (dirty) await save();
      return;
    }
    clear(); user = nextUser; authMode = 'login';
    await load();
  }
  async function save() {
    clearTimeout(timer);
    if (pending) { await pending; if (dirty && state !== 'conflict' && state !== 'loginExpired') return save(); return !dirty; }
    if (!loaded || !user || !dirty) return !dirty;
    if (state === 'conflict') return false;
    const run = generation;
    let successful = true;
    const operation = (async () => {
      while (dirty && run === generation) {
        const sentRevision = revision;
        const document = getDocument();
        setState('saving');
        try {
          const result = await api('PUT', { document, version });
          if (run !== generation) return;
          version = result.version;
          dirty = revision !== sentRevision;
          setState(dirty ? 'saving' : 'saved');
        } catch (error) {
          if (run === generation) setState(error.status === 409 ? 'conflict' : error.status === 401 ? 'loginExpired' : 'saveError');
          successful = false; return;
        }
      }
    })();
    pending = operation;
    try { await operation; } finally { if (pending === operation) pending = null; }
    return successful && !dirty;
  }
  function changed() {
    if (!loaded || !user) return;
    dirty = true; revision++;
    if (['conflict', 'loginExpired'].includes(state)) return;
    setState('saving'); clearTimeout(timer); timer = setTimeout(save, 650);
  }
  function changeMode(mode) { authMode = mode; $('#auth-password').value = ''; message(''); refreshUI(); }
  $('#login-tab').addEventListener('click', () => changeMode('login'));
  $('#signup-tab').addEventListener('click', () => changeMode('signup'));
  $('#forgot-password').addEventListener('click', () => changeMode('reset'));
  $('#open-login').addEventListener('click', () => { changeMode(user ? 'reauth' : 'login'); $('#account-panel').hidden = false; $('#auth-email').focus(); });
  $('#retry-save').addEventListener('click', save);
  $('#retry-load').addEventListener('click', load);
  $('#reload-saved').addEventListener('click', async () => { if (pending) await pending; await load(); });
  $('#logout').addEventListener('click', async () => {
    if (authBusy) return;
    authBusy = true; refreshUI();
    try {
      if (dirty && !await save()) return;
      await logout(); clear();
    } catch { message('authError', true); $('#account-panel').hidden = false; }
    finally { authBusy = false; refreshUI(); }
  });
  $('#auth-form').addEventListener('submit', async event => {
    event.preventDefault(); if (authBusy) return;
    authBusy = true; message(''); refreshUI();
    const email = $('#auth-email').value.trim(), password = $('#auth-password').value;
    try {
      if (authMode === 'reset') {
        await requestPasswordRecovery(email); message('resetSent');
      } else if (authMode === 'recovery') {
        await updateUser({ password }); message('passwordUpdated'); authMode = 'login'; await activate(await getUser());
      } else if (authMode === 'invite') {
        const nextUser = await acceptInvite(inviteToken, password); inviteToken = undefined; await activate(nextUser);
      } else if (authMode === 'signup') {
        const nextUser = await signup(email, password, { full_name: $('#auth-name').value.trim() });
        if (nextUser.emailVerified || nextUser.confirmedAt) await activate(await getUser());
        else { changeMode('login'); message('confirmEmail'); }
      } else {
        if (user && dirty && user.email?.toLowerCase() !== email.toLowerCase()) { message('loginExpired', true); return; }
        const nextUser = await login(email, password);
        if (user && dirty && user.id !== nextUser.id) {
          await logout(); message('loginExpired', true); return;
        }
        await activate(nextUser);
      }
    } catch { message('authError', true); }
    finally { authBusy = false; $('#auth-password').value = ''; refreshUI(); }
  });
  onAuthChange((event, nextUser) => {
    if (authBusy) return;
    if (event === 'logout') clear();
    if (event === 'login' && nextUser?.id !== user?.id) void activate(nextUser);
  });
  window.addEventListener('beforeunload', event => { if (dirty) { event.preventDefault(); event.returnValue = ''; } });
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden' && dirty && state !== 'conflict') void save(); });
  async function initialize() {
    authBusy = true; refreshUI();
    try {
      const callback = await handleAuthCallback();
      const settings = await getSettings(); signupAllowed = !settings.disableSignup;
      if (callback?.type === 'recovery' || callback?.type === 'invite') {
        authMode = callback.type; inviteToken = callback.token;
        if (callback.user) user = callback.user;
      } else await activate(await getUser());
    } catch { message('authError', true); }
    finally { authBusy = false; refreshUI(); }
  }
  void initialize();
  return { changed, refreshUI };
}
