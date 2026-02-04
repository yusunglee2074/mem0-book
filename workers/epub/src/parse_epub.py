#!/usr/bin/env python3
import json
import os
import sys
import zipfile
import xml.etree.ElementTree as ET


def strip_ns(tag):
    if "}" in tag:
        return tag.split("}", 1)[1]
    return tag


def read_text(node):
    if node is None:
        return None
    if node.text:
        return node.text.strip()
    return None


def find_first(root, name, ns_uri):
    elem = root.find(f".//{{{ns_uri}}}{name}")
    return read_text(elem)


def parse_container(zf):
    data = zf.read("META-INF/container.xml")
    root = ET.fromstring(data)
    ns = {"c": "urn:oasis:names:tc:opendocument:xmlns:container"}
    rootfile = root.find(".//c:rootfile", ns)
    if rootfile is None:
        raise RuntimeError("No rootfile in container.xml")
    return rootfile.attrib.get("full-path")


def parse_opf(zf, opf_path):
    data = zf.read(opf_path)
    root = ET.fromstring(data)
    nsmap = {
        "dc": "http://purl.org/dc/elements/1.1/",
        "opf": "http://www.idpf.org/2007/opf",
    }
    title = find_first(root, "title", nsmap["dc"])
    author = find_first(root, "creator", nsmap["dc"])
    language = find_first(root, "language", nsmap["dc"])

    manifest = {}
    for item in root.findall(".//opf:manifest/opf:item", nsmap):
        manifest[item.attrib.get("id")] = item.attrib

    nav_href = None
    ncx_href = None

    for attrs in manifest.values():
        props = attrs.get("properties", "")
        media_type = attrs.get("media-type", "")
        href = attrs.get("href")
        if not href:
            continue
        if "nav" in props:
            nav_href = href
        if media_type == "application/x-dtbncx+xml":
            ncx_href = href

    base_dir = os.path.dirname(opf_path)
    nav_path = os.path.join(base_dir, nav_href) if nav_href else None
    ncx_path = os.path.join(base_dir, ncx_href) if ncx_href else None

    return title, author, language, nav_path, ncx_path


def parse_nav_html(zf, nav_path):
    data = zf.read(nav_path)
    try:
        root = ET.fromstring(data)
    except ET.ParseError:
        return []

    toc_nav = None
    for nav in root.iter():
        if strip_ns(nav.tag) != "nav":
            continue
        nav_type = (
            nav.attrib.get("{http://www.idpf.org/2007/ops}type")
            or nav.attrib.get("epub:type")
            or nav.attrib.get("type")
        )
        if nav_type and "toc" in nav_type:
            toc_nav = nav
            break

    if toc_nav is None:
        return []

    def parse_ol(ol, depth=0):
        lines = []
        for child in list(ol):
            if strip_ns(child.tag) != "li":
                continue
            text = None
            for li_child in list(child):
                if strip_ns(li_child.tag) == "a":
                    text = (li_child.text or "").strip()
                    break
            if text:
                lines.append("  " * depth + text)
            for li_child in list(child):
                if strip_ns(li_child.tag) == "ol":
                    lines.extend(parse_ol(li_child, depth + 1))
        return lines

    for child in list(toc_nav):
        if strip_ns(child.tag) == "ol":
            return parse_ol(child, 0)

    return []


def parse_ncx(zf, ncx_path):
    data = zf.read(ncx_path)
    root = ET.fromstring(data)
    ns = {"n": "http://www.daisy.org/z3986/2005/ncx/"}

    def parse_point(point, depth=0):
        lines = []
        label = point.find("n:navLabel/n:text", ns)
        if label is not None and label.text:
            lines.append("  " * depth + label.text.strip())
        for child in point.findall("n:navPoint", ns):
            lines.extend(parse_point(child, depth + 1))
        return lines

    lines = []
    for nav_point in root.findall(".//n:navMap/n:navPoint", ns):
        lines.extend(parse_point(nav_point, 0))
    return lines


def main():
    if len(sys.argv) < 2:
        print("{}")
        sys.exit(1)

    path = sys.argv[1]
    with zipfile.ZipFile(path, "r") as zf:
        opf_path = parse_container(zf)
        title, author, language, nav_path, ncx_path = parse_opf(zf, opf_path)

        toc_lines = []
        if nav_path:
            toc_lines = parse_nav_html(zf, nav_path)
        if not toc_lines and ncx_path:
            toc_lines = parse_ncx(zf, ncx_path)

    toc_text = "\n".join([line for line in toc_lines if line])

    payload = {
        "title": title,
        "author": author,
        "language": language,
        "toc_text": toc_text,
    }
    print(json.dumps(payload, ensure_ascii=False))


if __name__ == "__main__":
    main()
