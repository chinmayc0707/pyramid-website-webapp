import unittest
from app import create_app


class AppRoutesTestCase(unittest.TestCase):
    def setUp(self):
        self.app = create_app()
        self.app.config["TESTING"] = True
        self.client = self.app.test_client()

    def test_health_check(self):
        response = self.client.get("/health")
        self.assertEqual(response.status_code, 200)
        data = response.get_json()
        self.assertEqual(data["status"], "healthy")

    def test_html_routes(self):
        routes = [
            "/",
            "/consulting",
            "/recruitment",
            "/outsourcing",
            "/training",
            "/stories",
            "/about",
            "/faq",
            "/contact",
        ]
        for route in routes:
            with self.subTest(route=route):
                response = self.client.get(route)
                self.assertEqual(response.status_code, 200)
                self.assertIn("text/html", response.content_type)
                self.assertIn("Pyramid Solutions", response.get_data(as_text=True))

    def test_markdown_content_negotiation(self):
        routes = [
            "/",
            "/consulting",
            "/recruitment",
            "/outsourcing",
            "/training",
            "/stories",
            "/about",
            "/faq",
            "/contact",
        ]
        for route in routes:
            with self.subTest(route=route):
                response = self.client.get(route, headers={"Accept": "text/markdown"})
                self.assertEqual(response.status_code, 200)
                self.assertIn("text/markdown", response.content_type)
                self.assertIn("#", response.get_data(as_text=True))

    def test_json_content_negotiation(self):
        routes = [
            "/consulting",
            "/recruitment",
            "/outsourcing",
            "/training",
            "/stories",
            "/about",
            "/faq",
            "/contact",
        ]
        for route in routes:
            with self.subTest(route=route):
                response = self.client.get(route, headers={"Accept": "application/json"})
                self.assertEqual(response.status_code, 200)
                data = response.get_json()
                self.assertEqual(data["page"], route.lstrip("/"))

    def test_sitemap(self):
        response = self.client.get("/sitemap.xml")
        self.assertEqual(response.status_code, 200)
        self.assertIn("application/xml", response.content_type)
        content = response.get_data(as_text=True)
        self.assertIn("/consulting", content)
        self.assertIn("/recruitment", content)


if __name__ == "__main__":
    unittest.main()
