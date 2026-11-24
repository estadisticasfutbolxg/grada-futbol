"""The new vector flags must remain passive and cannot load external content."""
from pathlib import Path
import sys
import unittest

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'scripts'))
from build_worker import validate_flag
sys.path.pop(0)


class FlagSafety(unittest.TestCase):
    def test_reviewed_source_flags_include_passive_local_clips_and_reuse(self):
        for flag in (ROOT / 'dist/assets/flags').glob('*.svg'):
            with self.subTest(flag=flag.name):
                validate_flag(flag.read_bytes())

    def test_rejects_active_content_external_references_and_xml_base(self):
        for content in ['<script/>', '<foreignObject/>', '<path onload="bad()"/>', '<use href="https://other.test/x.svg#a"/>', '<path clip-path="url(https://other.test/x)"/>', '<g xml:base="https://other.test/"/>', '<style/>']:
            with self.subTest(content=content), self.assertRaises(ValueError):
                validate_flag(('<svg xmlns="http://www.w3.org/2000/svg">' + content + '</svg>').encode())

    def test_rejects_missing_duplicate_or_cyclic_local_references(self):
        for content in ['<use href="#missing"/>', '<path id="a"/><path id="a"/>', '<g id="a"><use href="#a"/></g>']:
            with self.subTest(content=content), self.assertRaises(ValueError):
                validate_flag(('<svg xmlns="http://www.w3.org/2000/svg">' + content + '</svg>').encode())


if __name__ == '__main__':
    unittest.main()
