# 初始化总和和计数器
total = 0.0 #总血糖
count = 0 #记录循环次数

# 循环10次，获取血糖数据
while count < 10:
    # 提示用户输入并接受
    data = input("请输入血糖数据: ") 
    
    # 尝试将输入转换为浮点数
    try:
        # 如果输入是空，跳过并提示重新输入
        if data.strip() == "":
            print("输入无效，请重新输入")
            continue
            
        # 将输入转换为浮点数
        value = float(data)
        total += value
        count += 1
    except ValueError:
        print("输入无效，请输入数字")

# 计算平均值
average = total / 10

# 格式化输出，保留2位小数
print(f"血糖平均值:{average:.2f}mmol/L")