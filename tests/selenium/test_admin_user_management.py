import sys
import time
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

def run_test():
    print("Setting up WebDriver...")
    service = Service(ChromeDriverManager().install())
    options = webdriver.ChromeOptions()
    driver = webdriver.Chrome(service=service, options=options)
    driver.set_window_size(1920, 1080)
    wait = WebDriverWait(driver, 15)
    
    try:
        # Step 1: Open login
        print("1. Opening http://localhost:5173/login")
        driver.get("http://localhost:5173/login")
        print("[OK] Step completed")
        
        # Step 2: Login as admin
        print("2. Logging in as admin")
        email_input = wait.until(EC.presence_of_element_located((By.XPATH, "//input[@type='email' or contains(@name, 'email')]")))
        email_input.clear()
        email_input.send_keys("eduauthregistry@gmail.com")
        
        password_input = driver.find_element(By.XPATH, "//input[@type='password' or contains(@name, 'password')]")
        password_input.clear()
        password_input.send_keys("admin123")
        
        login_btn = driver.find_element(By.XPATH, "//button[@type='submit' or contains(translate(., 'LOGIN', 'login'), 'login')]")
        login_btn.click()
        print("[OK] Step completed")
        
        # Step 3: Assert: redirected to admin dashboard
        print("3. Asserting redirect to admin dashboard")
        wait.until(EC.url_contains("/admin/dashboard"))
        print("[OK] Step completed")
        
        # Step 4: Assert: dashboard shows admin role interface
        print("4. Asserting dashboard shows admin role interface")
        wait.until(EC.presence_of_element_located((By.XPATH, "//*[contains(translate(., 'ADMIN', 'admin'), 'admin') or contains(translate(., 'SYSTEM', 'system'), 'system')]")))
        print("[OK] Step completed")
        
        # Step 5: Navigate to /admin/users
        print("5. Navigating to /admin/users")
        users_link = wait.until(EC.element_to_be_clickable((By.XPATH, "//a[contains(@href, '/users')]")))
        driver.execute_script("arguments[0].click();", users_link)
        print("[OK] Step completed")
        
        # Step 6: Assert: users list page loads
        print("6. Asserting users list page loads")
        wait.until(EC.url_contains("/users"))
        print("[OK] Step completed")
        
        # Step 7: Assert: table or list of users is present
        print("7. Asserting User Management page content loads")
        wait.until(EC.presence_of_element_located((By.XPATH, "//*[contains(translate(., 'USER MANAGEMENT', 'user management'), 'user management') or contains(translate(., 'NO USERS', 'no users'), 'no users')]")))
        print("[OK] Step completed")
        
        # Step 8: Navigate to /admin/user-approvals
        print("8. Navigating to /admin/user-approvals")
        time.sleep(1)
        approvals_link = wait.until(EC.presence_of_element_located((By.XPATH, "//a[contains(@href, '/user-approvals') or contains(translate(., 'APPROVAL', 'approval'), 'approval')]")))
        driver.execute_script("arguments[0].click();", approvals_link)
        print("[OK] Step completed")
        
        # Step 9: Assert: pending approvals page loads
        print("9. Asserting pending approvals page loads")
        wait.until(EC.url_contains("status=pending"))
        wait.until(EC.presence_of_element_located((By.XPATH, "//table | //*[contains(translate(., 'PENDING', 'pending'), 'pending') or contains(translate(., 'APPROVE', 'approve'), 'approve')]")))
        print("[OK] Step completed")
        
        # Step 10: Navigate to /admin/analytics
        print("10. Navigating to /admin/analytics")
        time.sleep(1)
        analytics_link = wait.until(EC.presence_of_element_located((By.XPATH, "//a[contains(@href, '/analytics') or contains(translate(., 'ANALYTICS', 'analytics'), 'analytics')]")))
        driver.execute_script("arguments[0].click();", analytics_link)
        print("[OK] Step completed")
        
        # Step 11: Assert: analytics page loads with stat card visible
        print("11. Asserting analytics page loads")
        wait.until(EC.url_contains("/analytics"))
        wait.until(EC.presence_of_element_located((By.XPATH, "//*[contains(@class, 'card') or contains(@class, 'stat') or contains(translate(., 'TOTAL', 'total'), 'total')]")))
        print("[OK] Step completed")
        
        # Step 12: Navigate to /admin/activity-logs
        print("12. Navigating to /admin/activity-logs")
        time.sleep(1)
        logs_link = wait.until(EC.presence_of_element_located((By.XPATH, "//a[contains(@href, '/activity-logs') or contains(translate(., 'LOG', 'log'), 'log')]")))
        driver.execute_script("arguments[0].click();", logs_link)
        print("[OK] Step completed")
        
        # Step 13: Assert: activity logs page loads
        print("13. Asserting activity logs page loads")
        wait.until(EC.url_contains("/activity-logs"))
        print("[OK] Step completed")
        
        # Step 14: Assert: filter or table is present
        print("14. Asserting filter or table is present")
        wait.until(EC.presence_of_element_located((By.XPATH, "//table | //input | //select | //*[contains(translate(., 'FILTER', 'filter'), 'filter')]")))
        print("[OK] Step completed")
        
        # Step 15: Navigate to /admin/certificates
        print("15. Navigating to /admin/certificates")
        time.sleep(1)
        certs_link = wait.until(EC.presence_of_element_located((By.XPATH, "//a[contains(@href, '/certificates') and not(contains(@href, 'settings'))] | //a[contains(translate(., 'CERTIFICATES', 'certificates'), 'certificates')]")))
        driver.execute_script("arguments[0].click();", certs_link)
        print("[OK] Step completed")
        
        # Step 16: Assert: certificates management page loads
        print("16. Asserting certificates management page loads")
        wait.until(EC.url_contains("/certificates"))
        print("[OK] Step completed")
        
        # Step 17: Logout
        print("17. Clicking logout")
        time.sleep(3)
        logout_btn = wait.until(lambda d: d.execute_script("return Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Sign Out') || b.textContent.includes('Logout') || b.innerHTML.includes('log-out'));"))
        driver.execute_script("arguments[0].click();", logout_btn)
        print("[OK] Step completed")
        
        # Step 18: Assert: redirected away from admin area
        print("18. Asserting redirect after logout")
        wait.until(lambda d: "/admin" not in d.current_url)
        print("[OK] Step completed")
        
        print("\nTest passed successfully!")
        
    except Exception as e:
        print(f"[FAIL] Step failed: {str(e)}")
        sys.exit(1)
    finally:
        print("Cleaning up WebDriver...")
        driver.quit()

if __name__ == "__main__":
    run_test()
