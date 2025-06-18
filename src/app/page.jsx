"use client";
import Link from "next/link";
import { useState, useEffect, useContext, useRef } from "react";
import { useRouter } from "next/navigation";
import { StoreContext } from "@/lib/StoreContextProvider.jsx";
import { Input, Space } from "antd";
import { FaDice } from "react-icons/fa";
import { PiCoinsFill } from "react-icons/pi";
import { BiSolidStore } from "react-icons/bi";
import {
  drawPrizeAndUpdate,
  rollPrizeText,
  isPrizePoolEmpty,
} from "@/lib/lottery";
import { LotteryContainer } from "./index.style";
import { MdConfirmationNumber } from "react-icons/md";
import dayjs from "dayjs";

const { Search } = Input;

export default function Home() {
  const router = useRouter();
  const [rollingText, setRollingText] = useState("请输入小票号码");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [spent, setSpent] = useState("");
  const [loading, setLoading] = useState(false);
  const [disabled, setDisabled] = useState(true);
  const finalPrizeRef = useRef(null);
  const [history, setHistory] = useState([]);
  const { store, setStore, getStore, updateStore, getHistory, postHistory } = useContext(StoreContext);
  

  useEffect(() => {
    if (!store.Store_ID) router.push("/store");
  }, []);

  const rolling = async (invoiceNumber) => {
    finalPrizeRef.current = null;
    setLoading(true);
    setDisabled(true);
    let currentHistory = [];

    if (!invoiceNumber) {
      Stop("请输入小票号码");
      return;
    }
    setRollingText("准备中...");

    try {
      const preHistory = await getHistory(invoiceNumber);
      setHistory(preHistory);
      console.log("preHistory", preHistory);
      const times = Math.floor(parseFloat(spent) / parseFloat(store.Min_Spent));
      console.log("times", times);
      if (preHistory && preHistory.length >= times) {
        Stop("此号码已抽完奖项");
        return;
      }
    } catch {
      Stop("请再尝试或联系开发人员[Failed to fetch history]");
      return;
    }

    // 实际抽奖过程
    // 1. 更新重新获取更新 Store
    const store_id = localStorage.getItem("store_id");
    const storeData = await getStore(parseInt(store_id));

    // 2. 检查奖品池是否为空
    if (isPrizePoolEmpty(storeData.Prize)) {
      Stop("抱歉，奖池已空");
      return;
    }

    // 更新滚动文本 - 模拟抽奖过程 （同时返回停止滚动的控制器-手动）
    rollPrizeText(
      store.Prize,
      () => finalPrizeRef.current,
      setRollingText,
      () => Stop(finalPrizeRef.current)
    );

    // 3. 根据Store信息进行随机抽奖
    const { selected, afterPrizes } = drawPrizeAndUpdate(storeData.Prize);
    setStore((prev) => ({ ...prev, Prize: afterPrizes }));

    // 4. update/push更新后的store信息
    try {
      await Promise.all([
        updateStore({
          ...store,
          Prize: afterPrizes.map(({ Name, Quantity }) => ({ Name, Quantity })),
        }),
        postHistory({
          Code: invoiceNumber,
          Store_Name: store.Store_Name,
          Store_ID: store.Store_ID,
          Prize_Name: selected.Name,
          Spent: spent,
          Create_Date: new Date().toISOString(),
        }),
      ]);
    } catch {
      Stop(
        "请再尝试一遍或联系开发人员[failed to updateStore or failed to createHistory.]"
      );
      return;
    }

    // 5. create/post抽奖历史
    try {
      currentHistory = await getHistory(invoiceNumber);
    } catch {
      Stop("请再尝试一遍或联系开发人员[]");
      return;
    }

    finalPrizeRef.current = selected.Name;

    function Stop(message) {
      setRollingText(message);
      setLoading(false);
      setDisabled(false);
      if (currentHistory?.length > 0) {
        setHistory(currentHistory);
      }
    }
  };

  const spentChange = (value) => {
    setSpent(value);
    if (parseFloat(value) >= parseFloat(store.Min_Spent)) {
      setDisabled(false);
    } else {
      setDisabled(true);
    }
  };

  const reset = () => {
    setRollingText("请输入小票号码");
    setInvoiceNumber("");
    setSpent("");
    setDisabled(true);
    setHistory([]);
  };

  return (
    <LotteryContainer
      background_url={store.Background_URL}
      position={store.Position}
    >
      <div className="box">
        <h1>{store.Dashboard_Title}</h1>
        <Space.Compact size="large">
          <Input
            addonBefore={
              <PiCoinsFill
                fontSize={25}
                style={{ paddingTop: "0.3rem" }}
                color="#fff"
              />
            }
            prefix="￥"
            placeholder="金额"
            style={{ width: "13rem", minWidth: "150px" }}
            value={spent}
            onChange={(e) => spentChange(e.target.value)}
          />
          <Search
            addonBefore={
              <MdConfirmationNumber
                fontSize={25}
                style={{ paddingTop: "0.3rem" }}
                color="#fff"
              />
            }
            style={{ width: "25rem", minWidth: "250px" }}
            placeholder="小票号码"
            value={invoiceNumber}
            onChange={(e) => {
              setInvoiceNumber(e.target.value);
              setRollingText("请输入小票号码");
            }}
            onSearch={() => rolling(invoiceNumber)}
            enterButton={<FaDice fontSize={25} />}
            loading={loading}
            disabled={disabled}
          />
        </Space.Compact>
        <span onDoubleClick={() => reset()} className="rolling-box">
          {rollingText}
        </span>
        {spent && (
          <span className="times-limit">
            可抽奖次数：
            {Math.floor(parseFloat(spent) / parseFloat(store.Min_Spent))}
            {history?.length > 0 &&
              Math.floor(parseFloat(spent) / parseFloat(store.Min_Spent)) >=
                1 &&
              `
                , 剩余抽奖次数：
                ${
                  Math.floor(parseFloat(spent) / parseFloat(store.Min_Spent)) -
                  history.length
                }`}
          </span>
        )}

        {invoiceNumber && history?.length > 0 && (
          <ul className="history-list">
            {history
              .slice()
              .reverse()
              .map((h) => (
                <li key={h.createdAt}>
                  {h.Prize_Name} -{" "}
                  {dayjs(h.createdAt).format("YYYY/MM/DD HH:mm")}
                </li>
              ))}
          </ul>
        )}
      </div>
      <Link href="/store" className="icon-store-settings">
        <BiSolidStore size={22} />
      </Link>
    </LotteryContainer>
  );
}
