import os
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

        expected_urls = [
            "https://pyramidsolutions.com",
            "https://pyramidsolutions.com/consulting",
            "https://pyramidsolutions.com/recruitment",
            "https://pyramidsolutions.com/outsourcing",
            "https://pyramidsolutions.com/training",
            "https://pyramidsolutions.com/stories",
            "https://pyramidsolutions.com/about",
            "https://pyramidsolutions.com/faq",
            "https://pyramidsolutions.com/contact",
        ]
        for url in expected_urls:
            with self.subTest(url=url):
                self.assertIn(f"<loc>{url}</loc>", content)

    def test_sitemap_env_site_url(self):
        old_site_url = os.environ.get("SITE_URL")
        try:
            os.environ["SITE_URL"] = "https://customdomain.com"
            custom_app = create_app()
            custom_app.config["TESTING"] = True
            client = custom_app.test_client()
            response = client.get("/sitemap.xml")
            self.assertEqual(response.status_code, 200)
            content = response.get_data(as_text=True)
            self.assertIn("<loc>https://customdomain.com</loc>", content)
            self.assertIn("<loc>https://customdomain.com/consulting</loc>", content)
        finally:
            if old_site_url is not None:
                os.environ["SITE_URL"] = old_site_url
            else:
                os.environ.pop("SITE_URL", None)


if __name__ == "__main__":
    unittest.main()
