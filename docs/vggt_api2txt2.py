import replicate
import os
import numpy as np
import json
import tempfile
import requests
from PIL import Image
import base64
import struct


def export_txt_with_coordinates_and_colors(points, colors, output_path):
    """导出包含坐标和颜色的TXT文件，格式为 id,x,y,z,r,g,b"""
    with open(output_path, "w") as txt:
        for i in range(len(points)):
            x, y, z = points[i]
            r, g, b = colors[i]
            txt.write(f"{i+1},{x:.6f},{y:.6f},{z:.6f},{r},{g},{b}\n")

    return True


def export_json_with_coordinates_colors_and_conf(
    points, colors, world_points_conf, output_path
):
    """导出包含坐标、颜色和置信度的JSON文件，格式为 {'txt': 'id,x,y,z,r,g,b格式的内容', 'conf': world_points_conf}"""

    # 生成txt格式的内容字符串
    txt_content = ""
    for i in range(len(points)):
        x, y, z = points[i]
        r, g, b = colors[i]
        txt_content += f"{i+1},{x:.6f},{y:.6f},{z:.6f},{r},{g},{b}\n"

    # 移除末尾多余的换行符
    txt_content = txt_content.rstrip("\n")

    # 创建字典，包含txt内容和置信度信息
    result_dict = {"txt": txt_content, "conf": world_points_conf}

    # 写入JSON文件
    with open(output_path, "w", encoding="utf-8") as json_file:
        json.dump(result_dict, json_file, ensure_ascii=False, indent=2)

    return True


def main():
    # 1. 检查环境变量是否存在
    token = os.getenv("REPLICATE_API_TOKEN")
    print("API Token 是否读取到：", "是" if token else "否")

    # 2. 手动传入 Token 测试（临时验证）
    if not token:
        # 替换为你的真实 Token
        replicate_client = replicate.Client(
            api_token="YOUR_REPLICATE_API_TOKEN"
        )
    else:
        replicate_client = replicate.Client()

    # 设置输入图像路径和输出目录
    image_path = "d.jpgh"  # 原始图像路径
    output_dir = "./output"
    os.makedirs(output_dir, exist_ok=True)

    # 检查输入图像是否存在
    if not os.path.exists(image_path):
        print(f"警告: 输入图像 {image_path} 不存在，使用URL替代")
        image_urls = [
            "https://replicate.delivery/pbxt/NpIt8oRt3R0lRSWv6VP7E8AB5UzhEYgfMudWMFh8lDFaCELj/001.png"
        ]
        # 从URL下载图像以供颜色提取使用
        response = requests.get(image_urls[0])
        if response.status_code == 200:
            # 创建临时图像文件
            with tempfile.NamedTemporaryFile(delete=False, suffix=".png") as tmp_file:
                tmp_file.write(response.content)
                virtual_image_path = tmp_file.name
            # 打开下载的图像以获取尺寸
            img = Image.open(virtual_image_path)
            img_width, img_height = img.size
    else:
        # 图像存在，获取图像尺寸
        img = Image.open(image_path)
        img_width, img_height = img.size  # 获取图像尺寸

        # 如果图像存在，将其作为URL或文件路径传递给API
        virtual_image_path = image_path

        # 将图像转换为base64编码的URL
        with open(image_path, "rb") as img_file:
            img_base64 = base64.b64encode(img_file.read()).decode("utf-8")
            img_ext = os.path.splitext(image_path)[1][1:]  # 获取扩展名，去掉点号
            base64_image_url = f"data:image/{img_ext};base64,{img_base64}"

        image_urls = [base64_image_url]

    try:
        output = replicate_client.run(
            "vufinder/vggt-1b:770898f053ca56571e8a49d71f27fc695b6d203e0691baa30d8fbb6954599f2b",
            input={
                "images": image_urls,
                "pcd_source": "point_head",
                "return_pcd": True,
            },
        )

        print("API响应:", output)

        # 检查API响应结构
        if (
            "data" in output
            and isinstance(output["data"], list)
            and len(output["data"]) > 0
        ):
            # 获取第一个data元素，它应该是一个FileOutput对象
            data_file = output["data"][0]

            # 读取FileOutput对象的内容
            data_response = requests.get(str(data_file))
            if data_response.status_code != 200:
                print("无法下载data文件")
                return

            # 解析JSON数据
            data = data_response.json()
            world_points = data.get("world_points", [])
            world_points_conf = data.get("world_points_conf", [])

            if not world_points:
                print("未找到world_points数据")
                return

            print(f"提取到 {len(world_points)} 个世界坐标点")
            # print(f"World Points Confidence: {json.dumps(world_points_conf, indent=2)}")

            # 生成输出文件名
            base_name = (
                os.path.splitext(os.path.basename(image_path))[0]
                if os.path.exists(image_path)
                else "output"
            )
            txt_path = os.path.join(output_dir, f"{base_name}_pointcloud.txt")

            # 转换为numpy数组便于处理
            points = np.array(world_points)
            print(f"原始点云形状: {points.shape}")

            # 确保points是正确的形状 (N, 3)，其中N是点的数量
            if len(points.shape) == 3:
                # 如果形状是 (N, N, 3)，需要重塑为 (N*N, 3)
                if points.shape[0] == points.shape[1]:
                    points = points.reshape(-1, 3)
                    world_points = points.tolist()  # 同步更新world_points
                else:
                    # 如果是其他三维形状，尝试重塑
                    points = points.reshape(-1, points.shape[-1])
                    world_points = points.tolist()
            elif len(points.shape) == 2 and points.shape[1] != 3:
                # 如果第二维不是3（即不是x,y,z坐标），则需要调整
                if points.shape[0] == 3:
                    points = points.T  # 转置
                    world_points = points.tolist()
            elif len(points.shape) == 1:
                # 如果是一维数组，需要重新整形
                if len(points) % 3 == 0:
                    points = points.reshape(-1, 3)
                    world_points = points.tolist()

            print(f"处理后点云形状: {points.shape}")

            # 如果需要对点云进行处理（例如缩放和平移），可以在这里添加
            scale_factor = 10.0

            # 创建旋转矩阵 (180度绕Y轴)
            cos_theta = np.cos(np.pi)
            sin_theta = np.sin(np.pi)
            rotation_matrix = np.array(
                [
                    [cos_theta, sin_theta, 0],
                    [-sin_theta, cos_theta, 0],
                    [0, 0, 1],
                ]
            )

            # 应用旋转矩阵到所有点
            points = np.dot(points, rotation_matrix.T)

            # 处理坐标（平移到原点并缩放）
            center = np.mean(points, axis=0)
            points = points - center
            extent = np.max(np.abs(points))
            if extent > 0:
                points = points / extent * scale_factor

            # 从原始图像中提取颜色信息
            # 按照从左下到右上，逐行对应的映射关系
            colors = []

            # 首先加载图像到内存
            if virtual_image_path is not None:
                img = Image.open(virtual_image_path)
                # 将图像resize到518*518
                img = img.resize((518, 518))
                img_data = img.load()  # 加载像素数据到内存中
                # 更新图像尺寸
                img_width, img_height = img.size
            else:
                img_data = None

            # 计算点云总数，用于映射到图像像素
            total_points = len(points)
            total_pixels = img_width * img_height
            print(
                f"点云总数: {total_points}, 图像像素总数: {total_pixels} (图像已resize到518x518)"
            )

            for i in range(len(points)):
                if img_data is not None and i < len(world_points):
                    # 按照索引比例映射到图像坐标（从左上到右下，逐行映射）
                    # 将点的索引映射到图像的行和列
                    pixel_idx = (
                        int((i / len(world_points)) * (img_width * img_height - 1))
                        if len(world_points) > 1
                        else 0
                    )
                    px = pixel_idx % img_width  # 列索引 (0 到 img_width-1)
                    py = pixel_idx // img_width  # 行索引 (从顶部开始)

                    # 确保坐标在有效范围内
                    px = max(0, min(px, img_width - 1))
                    py = max(0, min(py, img_height - 1))

                    # 直接从内存中获取像素颜色
                    pixel = img_data[px, py]
                    if isinstance(pixel, tuple) and len(pixel) >= 3:
                        # RGB 或 RGBA
                        r, g, b = pixel[:3]
                    elif isinstance(pixel, int):
                        # 灰度图像，复制到RGB
                        r = g = b = pixel
                    else:
                        # 其他情况，默认白色
                        r, g, b = 255, 255, 255

                    color = [int(r), int(g), int(b)]
                else:
                    color = [255, 255, 255]  # 白色作为默认值
                colors.append(color)

            colors = np.array(colors, dtype=np.uint8)

            # 导出TXT
            print(f"导出TXT: {txt_path}")
            export_txt_with_coordinates_and_colors(points, colors, txt_path)

            # 导出JSON
            json_path = os.path.splitext(txt_path)[0] + ".json"
            print(f"导出JSON: {json_path}")
            export_json_with_coordinates_colors_and_conf(
                points, colors, world_points_conf, json_path
            )

            print(f"\n转换完成! TXT文件已保存至: {txt_path}")
            print(f"JSON文件已保存至: {json_path}")

            # 清理临时文件（如果存在）
            if virtual_image_path and not os.path.exists(image_path):
                try:
                    os.unlink(virtual_image_path)
                except:
                    pass  # 忽略删除临时文件时可能出现的错误
        else:
            print("API响应中没有'data'字段或数据为空")
            print("响应内容:", output)
    except Exception as e:
        print(f"调用API时发生错误: {str(e)}")
    finally:
        # 确保临时文件被清理
        if (
            "virtual_image_path" in locals()
            and virtual_image_path
            and not os.path.exists(image_path)
        ):
            try:
                os.unlink(virtual_image_path)
            except:
                pass  # 忽略删除临时文件时可能出现的错误


if __name__ == "__main__":
    main()
