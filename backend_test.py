#!/usr/bin/env python3
"""
Comprehensive Backend API Testing for QR Attendance App
Tests all CRUD operations, authentication, attendance logic, and reporting
"""

import requests
import sys
import json
from datetime import datetime, date, time, timedelta
import uuid

class QRAttendanceAPITester:
    def __init__(self, base_url="https://qr-attendance-rh.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_data = {
            'admin_id': None,
            'jamaah_id': None,
            'kajian_id': None
        }

    def log_test(self, name, success, details=""):
        """Log test results"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name} - PASSED {details}")
        else:
            print(f"❌ {name} - FAILED {details}")
        return success

    def make_request(self, method, endpoint, data=None, expected_status=200, auth_required=True):
        """Make HTTP request with proper headers"""
        url = f"{self.api_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        
        if auth_required and self.token:
            headers['Authorization'] = f'Bearer {self.token}'

        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=10)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers, timeout=10)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, timeout=10)
            else:
                return False, {}, f"Unsupported method: {method}"

            success = response.status_code == expected_status
            try:
                response_data = response.json() if response.content else {}
            except:
                response_data = {}

            details = f"Status: {response.status_code}"
            if not success:
                details += f", Expected: {expected_status}"
                if response_data:
                    details += f", Response: {response_data}"

            return success, response_data, details

        except requests.exceptions.RequestException as e:
            return False, {}, f"Request failed: {str(e)}"

    def test_admin_authentication(self):
        """Test admin login with default credentials"""
        print("\n🔐 Testing Admin Authentication...")
        
        # Test valid login - adminrh
        success, response, details = self.make_request(
            'POST', 'auth/login', 
            {'username': 'adminrh', 'password': 'cintaquran'}, 
            200, auth_required=False
        )
        
        if success and 'access_token' in response:
            self.token = response['access_token']
            self.log_test("Admin Login (adminrh)", True, details)
        else:
            self.log_test("Admin Login (adminrh)", False, details)
            return False

        # Test valid login - pesmarh
        success, response, details = self.make_request(
            'POST', 'auth/login', 
            {'username': 'pesmarh', 'password': 'rhmantab'}, 
            200, auth_required=False
        )
        self.log_test("Admin Login (pesmarh)", success, details)

        # Test invalid login
        success, response, details = self.make_request(
            'POST', 'auth/login', 
            {'username': 'invalid', 'password': 'wrong'}, 
            401, auth_required=False
        )
        self.log_test("Invalid Login Rejection", success, details)

        return True

    def test_admin_crud(self):
        """Test Admin CRUD operations"""
        print("\n👥 Testing Admin CRUD Operations...")
        
        # Get all admins
        success, response, details = self.make_request('GET', 'admin')
        self.log_test("Get All Admins", success, details)

        # Create new admin
        new_admin_data = {
            'username': f'testadmin_{datetime.now().strftime("%H%M%S")}',
            'password': 'testpass123'
        }
        
        success, response, details = self.make_request('POST', 'admin', new_admin_data, 200)
        if success and 'id' in response:
            self.test_data['admin_id'] = response['id']
            self.log_test("Create Admin", True, details)
        else:
            self.log_test("Create Admin", False, details)

        # Test duplicate username
        success, response, details = self.make_request('POST', 'admin', new_admin_data, 400)
        self.log_test("Duplicate Username Rejection", success, details)

        # Update admin
        if self.test_data['admin_id']:
            update_data = {
                'username': new_admin_data['username'] + '_updated',
                'password': 'newpass123'
            }
            success, response, details = self.make_request(
                'PUT', f"admin/{self.test_data['admin_id']}", update_data
            )
            self.log_test("Update Admin", success, details)

        # Delete admin
        if self.test_data['admin_id']:
            success, response, details = self.make_request(
                'DELETE', f"admin/{self.test_data['admin_id']}", expected_status=200
            )
            self.log_test("Delete Admin", success, details)

    def test_jamaah_crud(self):
        """Test Jamaah CRUD operations"""
        print("\n🕌 Testing Jamaah CRUD Operations...")
        
        # Get all jamaah
        success, response, details = self.make_request('GET', 'jamaah')
        self.log_test("Get All Jamaah", success, details)

        # Create new jamaah
        new_jamaah_data = {
            'nama': f'Test Jamaah {datetime.now().strftime("%H%M%S")}',
            'hp': f'08123456{datetime.now().strftime("%H%M")}'
        }
        
        success, response, details = self.make_request('POST', 'jamaah', new_jamaah_data, 200)
        if success and 'id' in response:
            self.test_data['jamaah_id'] = response['id']
            self.log_test("Create Jamaah", True, details)
        else:
            self.log_test("Create Jamaah", False, details)

        # Test duplicate phone number
        success, response, details = self.make_request('POST', 'jamaah', new_jamaah_data, 400)
        self.log_test("Duplicate Phone Rejection", success, details)

        # Create jamaah without phone
        jamaah_no_phone = {
            'nama': f'Test Jamaah No Phone {datetime.now().strftime("%H%M%S")}'
        }
        success, response, details = self.make_request('POST', 'jamaah', jamaah_no_phone, 200)
        self.log_test("Create Jamaah Without Phone", success, details)

        # Update jamaah
        if self.test_data['jamaah_id']:
            update_data = {
                'nama': new_jamaah_data['nama'] + ' Updated',
                'hp': new_jamaah_data['hp']
            }
            success, response, details = self.make_request(
                'PUT', f"jamaah/{self.test_data['jamaah_id']}", update_data
            )
            self.log_test("Update Jamaah", success, details)

    def test_kajian_crud(self):
        """Test Kajian CRUD operations"""
        print("\n📚 Testing Kajian CRUD Operations...")
        
        # Get all kajian
        success, response, details = self.make_request('GET', 'kajian')
        self.log_test("Get All Kajian", success, details)

        # Create new kajian
        today = date.today()
        new_kajian_data = {
            'judul': f'Test Kajian {datetime.now().strftime("%H%M%S")}',
            'tanggal': today.isoformat(),
            'jam_mulai': '19:00',
            'jam_selesai': '21:00'
        }
        
        success, response, details = self.make_request('POST', 'kajian', new_kajian_data, 200)
        if success and 'id' in response:
            self.test_data['kajian_id'] = response['id']
            self.log_test("Create Kajian", True, details)
        else:
            self.log_test("Create Kajian", False, details)

        # Update kajian
        if self.test_data['kajian_id']:
            update_data = {
                'judul': new_kajian_data['judul'] + ' Updated',
                'tanggal': new_kajian_data['tanggal'],
                'jam_mulai': '18:30',
                'jam_selesai': '20:30'
            }
            success, response, details = self.make_request(
                'PUT', f"kajian/{self.test_data['kajian_id']}", update_data
            )
            self.log_test("Update Kajian", success, details)

        # Test public kajian access
        if self.test_data['kajian_id']:
            success, response, details = self.make_request(
                'GET', f"kajian/{self.test_data['kajian_id']}/public", 
                auth_required=False
            )
            self.log_test("Get Public Kajian", success, details)

    def test_qr_generation(self):
        """Test QR code generation"""
        print("\n📱 Testing QR Code Generation...")
        
        if not self.test_data['kajian_id']:
            self.log_test("QR Generation", False, "No kajian_id available")
            return

        # Test QR code generation
        try:
            url = f"{self.api_url}/kajian/{self.test_data['kajian_id']}/qr"
            headers = {'Authorization': f'Bearer {self.token}'}
            response = requests.get(url, headers=headers, timeout=10)
            
            success = response.status_code == 200 and response.headers.get('content-type') == 'image/png'
            details = f"Status: {response.status_code}, Content-Type: {response.headers.get('content-type')}"
            self.log_test("Generate QR Code", success, details)
            
        except Exception as e:
            self.log_test("Generate QR Code", False, f"Error: {str(e)}")

    def test_attendance_system(self):
        """Test attendance submission and validation"""
        print("\n✅ Testing Attendance System...")
        
        if not self.test_data['jamaah_id'] or not self.test_data['kajian_id']:
            self.log_test("Attendance System", False, "Missing jamaah_id or kajian_id")
            return

        # Test successful attendance
        attendance_data = {
            'id_jamaah': self.test_data['jamaah_id'],
            'id_kajian': self.test_data['kajian_id']
        }
        
        success, response, details = self.make_request(
            'POST', 'presensi', attendance_data, 200, auth_required=False
        )
        
        if success and response.get('success'):
            expected_message = "✅ Presensi berhasil, semoga bermanfaat ilmunya."
            if response.get('message') == expected_message:
                self.log_test("Successful Attendance", True, details)
            else:
                self.log_test("Successful Attendance", False, f"Wrong message: {response.get('message')}")
        else:
            self.log_test("Successful Attendance", False, details)

        # Test duplicate attendance
        success, response, details = self.make_request(
            'POST', 'presensi', attendance_data, 200, auth_required=False
        )
        
        if success and not response.get('success'):
            expected_message = "⚠️ Anda sudah presensi untuk kajian ini."
            if response.get('message') == expected_message:
                self.log_test("Duplicate Attendance Prevention", True, details)
            else:
                self.log_test("Duplicate Attendance Prevention", False, f"Wrong message: {response.get('message')}")
        else:
            self.log_test("Duplicate Attendance Prevention", False, details)

        # Test attendance with invalid jamaah
        invalid_attendance = {
            'id_jamaah': str(uuid.uuid4()),
            'id_kajian': self.test_data['kajian_id']
        }
        
        success, response, details = self.make_request(
            'POST', 'presensi', invalid_attendance, 200, auth_required=False
        )
        
        if success and not response.get('success'):
            expected_message = "Jamaah tidak ditemukan"
            if response.get('message') == expected_message:
                self.log_test("Invalid Jamaah Rejection", True, details)
            else:
                self.log_test("Invalid Jamaah Rejection", False, f"Wrong message: {response.get('message')}")
        else:
            self.log_test("Invalid Jamaah Rejection", False, details)

        # Test attendance with invalid kajian
        invalid_kajian_attendance = {
            'id_jamaah': self.test_data['jamaah_id'],
            'id_kajian': str(uuid.uuid4())
        }
        
        success, response, details = self.make_request(
            'POST', 'presensi', invalid_kajian_attendance, 200, auth_required=False
        )
        
        if success and not response.get('success'):
            expected_message = "Kajian tidak ditemukan"
            if response.get('message') == expected_message:
                self.log_test("Invalid Kajian Rejection", True, details)
            else:
                self.log_test("Invalid Kajian Rejection", False, f"Wrong message: {response.get('message')}")
        else:
            self.log_test("Invalid Kajian Rejection", False, details)

    def test_time_validation(self):
        """Test time-based attendance validation"""
        print("\n⏰ Testing Time Validation...")
        
        if not self.test_data['jamaah_id']:
            self.log_test("Time Validation", False, "No jamaah_id available")
            return

        # Create kajian for yesterday (should fail)
        yesterday = date.today() - timedelta(days=1)
        past_kajian_data = {
            'judul': f'Past Kajian {datetime.now().strftime("%H%M%S")}',
            'tanggal': yesterday.isoformat(),
            'jam_mulai': '19:00',
            'jam_selesai': '21:00'
        }
        
        success, response, details = self.make_request('POST', 'kajian', past_kajian_data, 200)
        if success and 'id' in response:
            past_kajian_id = response['id']
            
            # Try to attend past kajian
            attendance_data = {
                'id_jamaah': self.test_data['jamaah_id'],
                'id_kajian': past_kajian_id
            }
            
            success, response, details = self.make_request(
                'POST', 'presensi', attendance_data, 200, auth_required=False
            )
            
            if success and not response.get('success'):
                expected_message = "⏰ Waktu presensi sudah berakhir."
                if response.get('message') == expected_message:
                    self.log_test("Past Date Rejection", True, details)
                else:
                    self.log_test("Past Date Rejection", False, f"Wrong message: {response.get('message')}")
            else:
                self.log_test("Past Date Rejection", False, details)
        else:
            self.log_test("Past Date Rejection", False, "Failed to create past kajian")

    def test_reporting_system(self):
        """Test attendance reporting and CSV export"""
        print("\n📊 Testing Reporting System...")
        
        if not self.test_data['kajian_id']:
            self.log_test("Reporting System", False, "No kajian_id available")
            return

        # Test attendance report
        success, response, details = self.make_request('GET', f"laporan/{self.test_data['kajian_id']}")
        
        if success:
            required_fields = ['kajian', 'total_hadir', 'detail_kehadiran']
            has_all_fields = all(field in response for field in required_fields)
            
            if has_all_fields:
                self.log_test("Get Attendance Report", True, f"{details}, Total: {response.get('total_hadir', 0)}")
            else:
                self.log_test("Get Attendance Report", False, f"Missing fields: {required_fields}")
        else:
            self.log_test("Get Attendance Report", False, details)

        # Test CSV export
        try:
            url = f"{self.api_url}/laporan/{self.test_data['kajian_id']}/export"
            headers = {'Authorization': f'Bearer {self.token}'}
            response = requests.get(url, headers=headers, timeout=10)
            
            success = response.status_code == 200 and 'text/csv' in response.headers.get('content-type', '')
            details = f"Status: {response.status_code}, Content-Type: {response.headers.get('content-type')}"
            self.log_test("Export CSV Report", success, details)
            
        except Exception as e:
            self.log_test("Export CSV Report", False, f"Error: {str(e)}")

    def cleanup_test_data(self):
        """Clean up test data"""
        print("\n🧹 Cleaning up test data...")
        
        # Delete test jamaah
        if self.test_data['jamaah_id']:
            success, _, details = self.make_request('DELETE', f"jamaah/{self.test_data['jamaah_id']}")
            self.log_test("Cleanup Jamaah", success, details)

        # Delete test kajian
        if self.test_data['kajian_id']:
            success, _, details = self.make_request('DELETE', f"kajian/{self.test_data['kajian_id']}")
            self.log_test("Cleanup Kajian", success, details)

    def run_all_tests(self):
        """Run all backend tests"""
        print("🚀 Starting QR Attendance Backend API Tests...")
        print(f"Testing against: {self.base_url}")
        
        # Test authentication first
        if not self.test_admin_authentication():
            print("❌ Authentication failed, stopping tests")
            return False

        # Run all test suites
        self.test_admin_crud()
        self.test_jamaah_crud()
        self.test_kajian_crud()
        self.test_qr_generation()
        self.test_attendance_system()
        self.test_time_validation()
        self.test_reporting_system()
        
        # Cleanup
        self.cleanup_test_data()
        
        # Print summary
        print(f"\n📊 Test Summary:")
        print(f"Tests Run: {self.tests_run}")
        print(f"Tests Passed: {self.tests_passed}")
        print(f"Tests Failed: {self.tests_run - self.tests_passed}")
        print(f"Success Rate: {(self.tests_passed/self.tests_run)*100:.1f}%")
        
        return self.tests_passed == self.tests_run

def main():
    tester = QRAttendanceAPITester()
    success = tester.run_all_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())