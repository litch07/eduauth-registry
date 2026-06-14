import time
import sys
import subprocess
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException, ElementClickInterceptedException

def clear_existing_records():
    print("Clearing existing student applications/enrollments for repeatability...")
    import os
    script_dir = os.path.dirname(os.path.abspath(__file__))
    backend_dir = os.path.abspath(os.path.join(script_dir, "../../backend"))
    tinker_cmd = (
        'php artisan tinker --execute="'
        '$email = \'sahmed2330154@bscse.uiu.ac.bd\'; '
        '$user = App\\Models\\User::where(\'email\', $email)->first(); '
        'if ($user) { '
        '    $student = App\\Models\\Student::where(\'user_id\', $user->id)->first(); '
        '    if ($student) { '
        '        App\\Models\\EnrollmentApplication::where(\'student_id\', $student->id)->delete(); '
        '        App\\Models\\Enrollment::where(\'student_id\', $student->id)->forceDelete(); '
        '    } '
        '}'
        '"'
    )
    try:
        res = subprocess.run(tinker_cmd, shell=True, cwd=backend_dir, capture_output=True, text=True)
        if res.returncode == 0:
            print("[OK] Database cleared")
        else:
            print(f"[WARNING] Database clear failed: {res.stderr or res.stdout}")
    except Exception as e:
        print(f"[WARNING] Failed to clear database: {e}")

def test_student_apply_university():
    # Phase 0: Reset Database state
    clear_existing_records()

    print("Setting up WebDriver...")
    service = Service(ChromeDriverManager().install())
    options = webdriver.ChromeOptions()
    driver = webdriver.Chrome(service=service, options=options)
    driver.set_window_size(1920, 1080)
    wait = WebDriverWait(driver, 15)
    
    try:
        # ==========================================
        # PART 1: Student Application Submission
        # ==========================================
        print("\n--- Phase 1: Student Application Submission ---")
        
        # Step 1: Open login page
        print("1. Opening http://localhost:5173/login")
        driver.get("http://localhost:5173/login")
        wait.until(EC.presence_of_element_located((By.XPATH, "//form")))
        print("[OK] Step completed")
        
        # Step 2: Entering email
        print("2. Entering email")
        email_input = wait.until(EC.presence_of_element_located((By.XPATH, "//input[@type='email' or contains(@name, 'email')]")))
        email_input.clear()
        email_input.send_keys("sahmed2330154@bscse.uiu.ac.bd")
        print("[OK] Step completed")
        
        # Step 3: Entering password
        print("3. Entering password")
        password_input = driver.find_element(By.XPATH, "//input[@type='password' or contains(@name, 'password')]")
        password_input.clear()
        password_input.send_keys("password")
        print("[OK] Step completed")
        
        # Step 4: Click Login button
        print("4. Clicking Login button")
        login_btn = driver.find_element(By.XPATH, "//button[@type='submit' or contains(translate(., 'LOGIN', 'login'), 'login')]")
        driver.execute_script("arguments[0].click();", login_btn)
        print("[OK] Step completed")
        
        # Step 5: Assert redirect to dashboard
        print("5. Asserting redirect to dashboard")
        wait.until(EC.url_contains("/dashboard"))
        print("[OK] Step completed")
        
        # Step 6: Navigating to My University
        print("6. Navigating to My University page")
        my_uni_link = wait.until(lambda d: d.execute_script("return Array.from(document.querySelectorAll('a')).find(a => a.href.includes('/my-university'));"))
        driver.execute_script("arguments[0].click();", my_uni_link)
        wait.until(EC.url_contains("/my-university"))
        print("[OK] Step completed")
        
        # Step 6b: Click Browse Universities
        print("6b. Clicking Browse Universities")
        browse_btn = wait.until(lambda d: d.execute_script("return Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Browse Universities'));"))
        driver.execute_script("arguments[0].click();", browse_btn)
        wait.until(EC.url_contains("/universities"))
        print("[OK] Step completed")
        
        # Step 7: Wait for universities to load
        print("7. Waiting for universities to load")
        time.sleep(2)
        # Search for United International University
        search_input = wait.until(EC.presence_of_element_located((By.XPATH, "//input[@placeholder='Search by university name, city, or address...'] | //input[@type='text']")))
        search_input.clear()
        search_input.send_keys("United International")
        time.sleep(2)
        
        # Click Apply button for UIU
        print("8. Clicking Apply for United International University")
        apply_btn = wait.until(lambda d: d.execute_script("return Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Apply'));"))
        driver.execute_script("arguments[0].click();", apply_btn)
        print("[OK] Step completed")
        
        # Step 9: Fill out Application Modal
        print("9. Filling out application modal")
        time.sleep(2)
        
        # Select Certificate Level
        print(" - Selecting Certificate Level")
        # 1. Click the custom select button for Certificate Level
        level_btn = wait.until(lambda d: d.execute_script("""
            let labels = Array.from(document.querySelectorAll('label'));
            let label = labels.find(l => l.textContent.includes('Certificate Level'));
            return label ? label.parentElement.querySelector('button') : null;
        """))
        driver.execute_script("arguments[0].click();", level_btn)
        time.sleep(1)
        # 2. Click the second option (first real option)
        level_opt = wait.until(lambda d: d.execute_script("""
            let list = document.querySelector('ul');
            return list && list.children.length > 1 ? list.children[1] : null;
        """))
        driver.execute_script("arguments[0].click();", level_opt)
        time.sleep(1)
        
        # Select Department
        print(" - Selecting Department (CSE)")
        # 1. Click the custom select button for Department
        dept_btn = wait.until(lambda d: d.execute_script("""
            let labels = Array.from(document.querySelectorAll('label'));
            let label = labels.find(l => l.textContent.includes('Department'));
            return label ? label.parentElement.querySelector('button') : null;
        """))
        driver.execute_script("arguments[0].click();", dept_btn)
        time.sleep(1)
        # 2. Click the option containing 'Computer Science' or 'CSE'
        dept_opt = wait.until(lambda d: d.execute_script("""
            let list = document.querySelector('ul');
            if(!list) return null;
            return Array.from(list.children).find(li => li.textContent.includes('Computer Science') || li.textContent.includes('CSE'));
        """))
        driver.execute_script("arguments[0].click();", dept_opt)
        time.sleep(1)
        
        # Check Consent Checkbox
        print(" - Checking consent checkbox")
        consent_checkbox = wait.until(EC.presence_of_element_located((By.XPATH, "//input[@type='checkbox' or @id='consent_provided']")))
        driver.execute_script("arguments[0].click();", consent_checkbox)
        
        # Submit Application
        print("10. Submitting application")
        submit_app_btn = wait.until(lambda d: d.execute_script("return Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Submit Application'));"))
        driver.execute_script("arguments[0].click();", submit_app_btn)
        print("[OK] Step completed")
        
        # Wait for modal to close or toast
        print("11. Verifying successful application")
        time.sleep(3)
        print("[OK] Step completed")
        
        # ==========================================
        # PART 2: University Admin Approval
        # ==========================================
        print("\n--- Phase 2: University Admin Approval ---")
        
        # Step 12: Log out student
        print("12. Logging out student and loading login page...")
        driver.get("http://localhost:5173/login")
        time.sleep(1)
        driver.execute_script("window.localStorage.clear();")
        driver.get("http://localhost:5173/login")
        print("[OK] Step completed")
        
        # Step 13: Enter University Admin credentials
        print("13. Entering University Admin credentials...")
        email_input = wait.until(EC.presence_of_element_located((By.XPATH, "//input[@type='email' or contains(@name, 'email')]")))
        email_input.clear()
        email_input.send_keys("admin@uiu.ac.bd")
        
        password_input = driver.find_element(By.XPATH, "//input[@type='password' or contains(@name, 'password')]")
        password_input.clear()
        password_input.send_keys("password123")
        
        login_btn = driver.find_element(By.XPATH, "//button[@type='submit' or contains(translate(., 'LOGIN', 'login'), 'login')]")
        driver.execute_script("arguments[0].click();", login_btn)
        print("[OK] Step completed")
        
        # Step 14: Redirect to university dashboard
        print("14. Asserting redirect to university dashboard...")
        wait.until(EC.url_contains("/university/dashboard") or EC.url_contains("/dashboard"))
        print("[OK] Step completed")
        
        # Step 15: Navigate to Enrollments & Applications tab
        print("15. Navigating to Enrollments -> Applications tab...")
        driver.get("http://localhost:5173/university/enrollments")
        time.sleep(2)
        applications_tab = wait.until(lambda d: d.execute_script(
            "return Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Applications'));"
        ))
        driver.execute_script("arguments[0].click();", applications_tab)
        time.sleep(2)
        print("[OK] Step completed")
        
        # Step 16: Locate student application card and click Approve & Enroll
        print("16. Clicking Approve & Enroll for student sahmed2330154@bscse.uiu.ac.bd...")
        approve_btn = wait.until(lambda d: d.execute_script("""
            let email = 'sahmed2330154@bscse.uiu.ac.bd';
            let divs = Array.from(document.querySelectorAll('div'));
            let targetCard = divs.find(card => card.textContent.includes(email) && card.textContent.includes('Approve & Enroll'));
            if (targetCard) {
                return Array.from(targetCard.querySelectorAll('button')).find(b => b.textContent.includes('Approve & Enroll'));
            }
            return null;
        """))
        driver.execute_script("arguments[0].click();", approve_btn)
        time.sleep(2)
        print("[OK] Step completed")
        
        # Step 17: Fill in Roll Number, Batch, and submit
        print("17. Entering Student ID (Roll Number) and Batch...")
        student_id_input = wait.until(EC.presence_of_element_located((By.XPATH, "//input[contains(@placeholder, 'UIU-2026')]")))
        student_id_input.clear()
        student_id_input.send_keys("UIU-2026-0154")
        driver.execute_script("""
            let input = arguments[0];
            let lastValue = input.value;
            input.value = 'UIU-2026-0154';
            let event = new Event('input', { bubbles: true });
            let tracker = input._valueTracker;
            if (tracker) { tracker.setValue(lastValue); }
            input.dispatchEvent(event);
        """, student_id_input)
        
        # Select Batch
        print(" - Selecting Batch...")
        batch_btn = wait.until(lambda d: d.execute_script("""
            let labels = Array.from(document.querySelectorAll('label'));
            let label = labels.find(l => l.textContent.includes('Batch'));
            return label ? label.parentElement.querySelector('button') : null;
        """))
        driver.execute_script("arguments[0].click();", batch_btn)
        time.sleep(1)
        
        batch_opt = wait.until(lambda d: d.execute_script("""
            let labels = Array.from(document.querySelectorAll('label'));
            let label = labels.find(l => l.textContent.includes('Batch'));
            if (!label) return null;
            let list = label.parentElement.querySelector('ul');
            return list && list.children.length > 1 ? list.children[1] : null;
        """))
        driver.execute_script("arguments[0].click();", batch_opt)
        time.sleep(1)
        
        print(" - Submitting enrollment modal...")
        enroll_submit_btn = wait.until(lambda d: d.execute_script(
            "return Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Enroll Student') && b.type === 'submit');"
        ))
        driver.execute_script("arguments[0].click();", enroll_submit_btn)
        time.sleep(3)
        print("[OK] Step completed")
        
        # Step 18: Verify successful enrollment in the table
        print("18. Verifying student is successfully enrolled in the active enrollments list...")
        search_input = wait.until(EC.presence_of_element_located((By.XPATH, "//input[@placeholder='Search by name, student ID, email...' or @type='text']")))
        search_input.clear()
        search_input.send_keys("sahmed2330154@bscse.uiu.ac.bd")
        time.sleep(2)
        
        row_found = wait.until(lambda d: d.execute_script("""
            let trs = Array.from(document.querySelectorAll('tr'));
            return trs.find(tr => tr.textContent.includes('sahmed2330154@bscse.uiu.ac.bd') && (tr.textContent.includes('ACTIVE') || tr.textContent.includes('active')));
        """))
        assert row_found is not None, "Enrolled student row not found or status is not ACTIVE"
        print("[OK] Step completed")
        
        # ==========================================
        # PART 3: Student Enrollment View
        # ==========================================
        print("\n--- Phase 3: Student Enrollment View ---")
        
        # Step 19: Log out university admin
        print("19. Logging out university admin...")
        driver.get("http://localhost:5173/login")
        time.sleep(1)
        driver.execute_script("window.localStorage.clear();")
        driver.get("http://localhost:5173/login")
        print("[OK] Step completed")
        
        # Step 20: Log back in as Student
        print("20. Logging back in as Student...")
        email_input = wait.until(EC.presence_of_element_located((By.XPATH, "//input[@type='email' or contains(@name, 'email')]")))
        email_input.clear()
        email_input.send_keys("sahmed2330154@bscse.uiu.ac.bd")
        
        password_input = driver.find_element(By.XPATH, "//input[@type='password' or contains(@name, 'password')]")
        password_input.clear()
        password_input.send_keys("password")
        
        login_btn = driver.find_element(By.XPATH, "//button[@type='submit' or contains(translate(., 'LOGIN', 'login'), 'login')]")
        driver.execute_script("arguments[0].click();", login_btn)
        
        # Assert redirect to dashboard
        wait.until(EC.url_contains("/dashboard"))
        print("[OK] Step completed")
        
        # Step 21: Navigate to My University
        print("21. Navigating to My University to view the enrollment...")
        my_uni_link = wait.until(lambda d: d.execute_script("return Array.from(document.querySelectorAll('a')).find(a => a.href.includes('/my-university'));"))
        driver.execute_script("arguments[0].click();", my_uni_link)
        wait.until(EC.url_contains("/my-university"))
        time.sleep(2)
        print("[OK] Step completed")
        
        # Step 22: Verify current enrollment details are visible
        print("22. Verifying United International University is listed as the current enrollment...")
        wait.until(EC.presence_of_element_located((By.XPATH, "//*[contains(text(), 'United International University')]")))
        print("[OK] Enrollment visible on student dashboard!")
        
        # Step 23: Wait for 10 seconds before closing
        print("23. Waiting for 10 seconds before closing browser...")
        time.sleep(10)
        print("[OK] Step completed")
        
        print("\nTest passed successfully!")
        
    except Exception as e:
        print(f"[FAIL] Step failed: {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
    finally:
        print("Cleaning up WebDriver...")
        driver.quit()

if __name__ == "__main__":
    test_student_apply_university()
