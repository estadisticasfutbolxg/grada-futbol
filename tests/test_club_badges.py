import importlib.util
from pathlib import Path
import struct
import unittest
import zlib

spec = importlib.util.spec_from_file_location('club_badges', Path(__file__).resolve().parents[1] / 'scripts/download_club_badges.py')
badges = importlib.util.module_from_spec(spec)
spec.loader.exec_module(badges)


def chunk(kind, data):
    return struct.pack('>I', len(data)) + kind + data + struct.pack('>I', zlib.crc32(kind + data) & 0xffffffff)


def png(width=1, height=1):
    return b'\x89PNG\r\n\x1a\n' + chunk(b'IHDR', struct.pack('>IIBBBBB', width, height, 8, 6, 0, 0, 0)) + chunk(b'IDAT', zlib.compress(b'\0\0\0\0\0')) + chunk(b'IEND', b'')


class BadgeValidation(unittest.TestCase):
    def test_numeric_urls_cannot_point_at_arbitrary_hosts(self):
        self.assertEqual(badges.badge_url('8634'), 'https://images.fotmob.com/image_resources/logo/teamlogo/8634.png')
        for value in ['../8634', 'https://other.test/1', '0', '1?secret=1', '1e3']:
            with self.assertRaises(ValueError):
                badges.badge_url(value)

    def test_png_integrity_dimensions_and_bounded_body(self):
        self.assertEqual(badges.validate_png(png()), (1, 1))
        for body in [b'<html>not an image</html>', png()[:-1], png() + b'garbage', png(513, 1), png(0, 1), png() + bytes(badges.PNG_LIMIT), png()[:40] + b'x' + png()[41:]]:
            with self.assertRaises(ValueError):
                badges.validate_png(body)

    def test_redirect_does_not_send_requests_to_another_image_or_host(self):
        import urllib.request
        request = urllib.request.Request(badges.badge_url('8634'))
        with self.assertRaises(ValueError):
            badges.SameImageRedirect().redirect_request(request, None, 302, '', {}, 'https://other.test/secret')
